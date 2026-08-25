(function (root, factory) {
    const installRayAny = factory()

    if (typeof module === "object" && module.exports) module.exports = installRayAny
    if (root.Matter) installRayAny(root.Matter)
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict"

    return function installRayAny(Matter) {
        if (!Matter || !Matter.Query || !Matter.Bounds || !Matter.Bodies || !Matter.Collision || !Matter.Vertices) {
            throw new TypeError("A complete Matter namespace is required")
        }
        const Bounds = Matter.Bounds
        const Bodies = Matter.Bodies
        const Collision = Matter.Collision
        const Vertices = Matter.Vertices

        function bodyContainsPoint(body, point) {
            if (!Bounds.contains(body.bounds, point)) return false
            const startPart = body.parts.length === 1 ? 0 : 1
            for (let i = startPart; i < body.parts.length; i++) {
                const part = body.parts[i]
                if (Bounds.contains(part.bounds, point) && Vertices.contains(part.vertices, point)) return true
            }
            return false
        }

        function partContainsPointStrict(part, point) {
            if (!Bounds.contains(part.bounds, point) || !Vertices.contains(part.vertices, point)) return false
            const vertices = part.vertices
            let a = vertices[vertices.length - 1]
            for (let i = 0; i < vertices.length; i++) {
                const b = vertices[i]
                const edgeDx = b.x - a.x
                const edgeDy = b.y - a.y
                const pointDx = point.x - a.x
                const pointDy = point.y - a.y
                const cross = edgeDx * pointDy - edgeDy * pointDx
                const tolerance = 1e-12 * (Math.abs(edgeDx * pointDy) + Math.abs(edgeDy * pointDx) + 1)
                if (Math.abs(cross) <= tolerance &&
                    point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) &&
                    point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y)) return false
                a = b
            }
            return true
        }

        if (!Matter.Query.rayAny) {
            Matter.Query.rayAny = function (bodies, start, end, rayWidth = 1e-100) {
                rayWidth = rayWidth || 1e-100
                const dx = end.x - start.x
                const dy = end.y - start.y
                const length = Math.sqrt(dx * dx + dy * dy)

                if (length === 0) {
                    for (let i = 0; i < bodies.length; i++) {
                        if (bodyContainsPoint(bodies[i], start)) return true
                    }
                    return false
                }

                const ray = Bodies.rectangle(
                    (start.x + end.x) * 0.5,
                    (start.y + end.y) * 0.5,
                    length,
                    rayWidth,
                    { angle: Math.atan2(dy, dx) }
                )
                const rayBounds = ray.bounds

                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i]
                    if (!Bounds.overlaps(body.bounds, rayBounds)) continue
                    const startPart = body.parts.length === 1 ? 0 : 1

                    for (let j = startPart; j < body.parts.length; j++) {
                        const part = body.parts[j]
                        if (Bounds.overlaps(part.bounds, rayBounds) && Collision.collides(part, ray)) return true
                    }
                }
                return false
            }
        }

        // Zero-width segment query for visibility checks. Unlike Query.ray, this
        // avoids constructing a temporary Matter body and stops at the first edge.
        if (!Matter.Query.segmentAny) {
            Matter.Query.segmentAny = function (bodies, start, end) {
                const rayMinX = start.x < end.x ? start.x : end.x
                const rayMaxX = start.x > end.x ? start.x : end.x
                const rayMinY = start.y < end.y ? start.y : end.y
                const rayMaxY = start.y > end.y ? start.y : end.y
                const rayDx = end.x - start.x
                const rayDy = end.y - start.y

                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i]
                    const bounds = body.bounds
                    if (rayMaxX < bounds.min.x || bounds.max.x < rayMinX ||
                        rayMaxY < bounds.min.y || bounds.max.y < rayMinY) continue

                    const startPart = body.parts.length === 1 ? 0 : 1
                    for (let j = startPart; j < body.parts.length; j++) {
                        const part = body.parts[j]
                        const partBounds = part.bounds
                        if (rayMaxX < partBounds.min.x || partBounds.max.x < rayMinX ||
                            rayMaxY < partBounds.min.y || partBounds.max.y < rayMinY) continue

                        if (partContainsPointStrict(part, start) || partContainsPointStrict(part, end)) return true

                        const vertices = part.vertices
                        let a = vertices[vertices.length - 1]
                        for (let k = 0; k < vertices.length; k++) {
                            const b = vertices[k]
                            const edgeMinX = a.x < b.x ? a.x : b.x
                            const edgeMaxX = a.x > b.x ? a.x : b.x
                            const edgeMinY = a.y < b.y ? a.y : b.y
                            const edgeMaxY = a.y > b.y ? a.y : b.y
                            if (!(rayMaxX < edgeMinX || edgeMaxX < rayMinX ||
                                rayMaxY < edgeMinY || edgeMaxY < rayMinY)) {
                                const edgeDx = b.x - a.x
                                const edgeDy = b.y - a.y
                                const denominator = edgeDy * rayDx - edgeDx * rayDy
                                if (denominator !== 0) {
                                    const offsetY = start.y - a.y
                                    const offsetX = start.x - a.x
                                    const rayFraction = (edgeDx * offsetY - edgeDy * offsetX) / denominator
                                    const edgeFraction = (rayDx * offsetY - rayDy * offsetX) / denominator
                                    if (rayFraction > 0 && rayFraction < 1 &&
                                        edgeFraction > 0 && edgeFraction < 1) return true
                                }
                            }
                            a = b
                        }
                    }
                }
                return false
            }
        }

        return Matter.Query
    }
})
