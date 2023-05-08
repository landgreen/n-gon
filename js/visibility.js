const v = {
    draw() {
        const pos = m.pos;
        const radius = 400;
        const vertices = v.circleCollisions(pos, radius);
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 1; i < vertices.length; i++) {
            var currentDistance = Math.sqrt((vertices[i - 1].x - pos.x)**2 + (vertices[i - 1].y - pos.y)**2);
            var newDistance = Math.sqrt((vertices[i].x - pos.x)**2 + (vertices[i].y - pos.y)**2);
            if (Math.abs(currentDistance - radius) < 1 && Math.abs(newDistance - radius) < 1) {
                const currentAngle = Math.atan2(vertices[i - 1].y - pos.y, vertices[i - 1].x - pos.x);
                const newAngle = Math.atan2(vertices[i].y - pos.y, vertices[i].x - pos.x);
                ctx.arc(pos.x, pos.y, radius, currentAngle, newAngle);
            } else {
                ctx.lineTo(vertices[i].x, vertices[i].y)
            }
        }
        newDistance = Math.sqrt((vertices[0].x - pos.x)**2 + (vertices[0].y - pos.y)**2);
        currentDistance = Math.sqrt((vertices[vertices.length - 1].x - pos.x)**2 + (vertices[vertices.length - 1].y - pos.y)**2);
        if (Math.abs(currentDistance - radius) < 1 && Math.abs(newDistance - radius) < 1) {
            const currentAngle = Math.atan2(vertices[vertices.length - 1].y - pos.y, vertices[vertices.length - 1].x - pos.x);
            const newAngle = Math.atan2(vertices[0].y - pos.y, vertices[0].x - pos.x);
            ctx.arc(pos.x, pos.y, radius, currentAngle, newAngle);
        } else {
            ctx.lineTo(vertices[0].x, vertices[0].y)
        }
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 10;
        ctx.stroke();
    },

    circleCollisions(pos, radius) {
        function getIntersections(v1, v1End, domain) {
            var best = {
                x: v1End.x,
                y: v1End.y,
                dist: Math.sqrt((v1End.x - v1.x)**2 + (v1End.y - v1.y)**2)
            }

            for (const obj of domain) {
                for (var i = 0; i < obj.vertices.length - 1; i++) {
                    results = simulation.checkLineIntersection(v1, v1End, obj.vertices[i], obj.vertices[i + 1]);
                    if (results.onLine1 && results.onLine2) {
                        const dx = results.x - v1.x;
                        const dy = results.y - v1.y;
                        const dist = Math.sqrt(dx**2 + dy**2);
                        if (dist < best.dist) {
                            best = {
                                x: results.x,
                                y: results.y,
                                dist: dist
                            };
                        }
                    }
                }
                results = simulation.checkLineIntersection(v1, v1End, obj.vertices[obj.vertices.length - 1], obj.vertices[0]);
                if (results.onLine1 && results.onLine2) {
                    const dx = results.x - v1.x;
                    const dy = results.y - v1.y;
                    const dist = Math.sqrt(dx**2 + dy**2);
                    if (dist < best.dist) {
                        best = {
                            x: results.x,
                            y: results.y,
                            dist: dist
                        };
                    }
                }
            }

            return best;
        }

        function allCircleLineCollisions(c, radius, domain) {
            var lines = [];
            for (const obj of domain) {
                //const obj = domain[0]
                for (var i = 0; i < obj.vertices.length - 1; i++) {
                    lines.push(circleLineCollisions(obj.vertices[i], obj.vertices[i + 1], c, radius));
                }
                lines.push(circleLineCollisions(obj.vertices[obj.vertices.length - 1], obj.vertices[0], c, radius));
            }
    
            const collisionLines = [];
            for (const line of lines) {
                if (line.length == 2) {
                    const distance1 = Math.sqrt((line[0].x - c.x)**2 + (line[0].y - c.y)**2)
                    const angle1 = Math.atan2(line[0].y - c.y, line[0].x - c.x);
                    const queryPoint1 = {
                        x: Math.cos(angle1) * (distance1 - 1) + c.x,
                        y: Math.sin(angle1) * (distance1 - 1) + c.y
                    }
                    const distance2 = Math.sqrt((line[1].x - c.x)**2 + (line[1].y - c.y)**2)
                    const angle2 = Math.atan2(line[1].y - c.y, line[1].x - c.x);
                    const queryPoint2 = {
                        x: Math.cos(angle2) * (distance2 - 1) + c.x,
                        y: Math.sin(angle2) * (distance2 - 1) + c.y
                    }
    
                    collisionLines.push(line)
                }
            }
    
            return collisionLines;
        }
    
        function circleLineCollisions(a, b, c, radius) {
            // calculate distances
            const angleOffset = Math.atan2(b.y - a.y, b.x - a.x);
            const sideB = Math.sqrt((a.x - c.x)**2 + (a.y - c.y)**2);
            const sideC = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2);
            const sideA = Math.sqrt((c.x - b.x)**2 + (c.y - b.y)**2);
    
            // calculate the closest point on line AB to point C
            const angleA = Math.acos((sideB**2 + sideC**2 - sideA**2) / (2 * sideB * sideC)) * (a.x - c.x) / -Math.abs(a.x - c.x)
            const sideAD = Math.cos(angleA) * sideB;
            const d = { // closest point
                x: Math.cos(angleOffset) * sideAD + a.x, 
                y: Math.sin(angleOffset) * sideAD + a.y
            }
            const distance = Math.sqrt((d.x - c.x)**2 + (d.y - c.y)**2);
            if (distance == radius) {
                // tangent
                return [d];
            } else if (distance < radius) {
                // secant
                const angleOffset = Math.atan2(d.y - c.y, d.x - c.x);
                const innerAngle = Math.acos(distance / radius);
                const intersection1 = {
                    x: Math.cos(angleOffset + innerAngle) * radius + c.x,
                    y: Math.sin(angleOffset + innerAngle) * radius + c.y
                }
    
                const intersection2 = {
                    x: Math.cos(angleOffset - innerAngle) * radius + c.x,
                    y: Math.sin(angleOffset - innerAngle) * radius + c.y
                }
    
                const distance1 = {
                    a: Math.sqrt((intersection1.x - a.x)**2 + (intersection1.y - a.y)**2),
                    b: Math.sqrt((intersection1.x - b.x)**2 + (intersection1.y - b.y)**2)
                }
                const distance2 = {
                    a: Math.sqrt((intersection2.x - a.x)**2 + (intersection2.y - a.y)**2),
                    b: Math.sqrt((intersection2.x - b.x)**2 + (intersection2.y - b.y)**2)
                }
                const result = [];
                if (Math.abs(sideC - (distance1.a + distance1.b)) < 0.01) {
                    result.push(intersection1);
                } else {
                    if (distance1.a < distance1.b) {
                        if (sideB <= radius) result.push(a);
                    } else {
                        if (sideA <= radius) result.push(b)
                    }
                }
                if (Math.abs(sideC - (distance2.a + distance2.b)) < 0.01) {
                    result.push(intersection2);
                } else {
                    if (distance2.a <= distance2.b) {
                        if (sideB <= radius) result.push(a);
                    } else {
                        if (sideA <= radius) result.push(b)
                    }
                }
    
                return result;
            } else {
                // no intersection
                return [];
            }
        }

        // include intersections in map elements to avoid issues with overlapping
        var intersectMap1 = [...map];
        for (var i = 0; i < intersectMap1.length; i++) {
            const obj = intersectMap1[i];
            const newVertices = [];
            const restOfMap = [...map].slice(0, i).concat([...map].slice(i + 1))
            for (var j = 0; j < obj.vertices.length - 1; j++) {
                var best = getIntersections(obj.vertices[j], obj.vertices[j + 1], restOfMap);
                newVertices.push(obj.vertices[j]);
                const distance = Math.sqrt((obj.vertices[j + 1].x - obj.vertices[j].x)**2 + (obj.vertices[j + 1].y - obj.vertices[j].y)**2);
                if (best.dist < distance) {
                    newVertices.push({ x: best.x, y: best.y });
                }
            }
            var best = getIntersections(obj.vertices[obj.vertices.length - 1], obj.vertices[0], restOfMap);
            newVertices.push(obj.vertices[j]);
            const distance = Math.sqrt((obj.vertices[obj.vertices.length - 1].x - obj.vertices[0].x)**2 + (obj.vertices[obj.vertices.length - 1].y - obj.vertices[0].y)**2);
            if (best.dist < distance) newVertices.push({ x: best.x, y: best.y })

            intersectMap1[i].vertices = newVertices;
        }

        const intersectMap = [];
        for (const obj of intersectMap1) {
            intersectMap.push({ vertices: obj.vertices })
        }
        intersectMap1 = [];

        var vertices = [];
        for (const obj of intersectMap) {
            for (var i = 0; i < obj.vertices.length; i++) {
                const vertex = obj.vertices[i];
                const angleToVertex = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
                const distanceToVertex = Math.sqrt((vertex.x - pos.x)**2 + (vertex.y - pos.y)**2);
                const queryPoint = {
                    x: Math.cos(angleToVertex) * (distanceToVertex - 1) + pos.x,
                    y: Math.sin(angleToVertex) * (distanceToVertex - 1) + pos.y
                }

                if (Matter.Query.ray(map, pos, queryPoint).length == 0) {
                    var distance = Math.sqrt((vertex.x - pos.x)**2 + (vertex.y - pos.y)**2);
                    var endPoint = {
                        x: vertex.x,
                        y: vertex.y
                    }

                    if (distance > radius) {
                        const angle = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
                        endPoint = {
                            x: Math.cos(angle) * radius + pos.x,
                            y: Math.sin(angle) * radius + pos.y
                        }

                        distance = radius
                    }

                    var best = getIntersections(pos, endPoint, map);

                    if (best.dist >= distance) {
                        best = {
                            x: endPoint.x,
                            y: endPoint.y,
                            dist: distance
                        }
                    }
                    vertices.push(best)


                    var angle = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
                    endPoint = {
                        x: Math.cos(angle + 0.001) * radius + pos.x,
                        y: Math.sin(angle + 0.001) * radius + pos.y
                    }

                    best = getIntersections(pos, endPoint, map);

                    if (best.dist >= radius) {
                        best = {
                            x: endPoint.x,
                            y: endPoint.y,
                            dist: radius
                        }
                    }
                    vertices.push(best)


                    angle = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
                    endPoint = {
                        x: Math.cos(angle - 0.001) * radius + pos.x,
                        y: Math.sin(angle - 0.001) * radius + pos.y
                    }

                    best = getIntersections(pos, endPoint, map);

                    if (best.dist >= radius) {
                        best = {
                            x: endPoint.x,
                            y: endPoint.y,
                            dist: radius
                        }
                    }
                    vertices.push(best)
                }
            }
        }

        const outerCollisions = allCircleLineCollisions(pos, radius, map);
        const circleCollisions = [];
        for (const line of outerCollisions) {
            for (const vertex of line) {
                const distance = Math.sqrt((vertex.x - pos.x)**2 + (vertex.y - pos.y)**2)
                const angle = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
                const queryPoint = {
                    x: Math.cos(angle) * (distance - 1) + pos.x,
                    y: Math.sin(angle) * (distance - 1) + pos.y
                }
                if (Math.abs(distance - radius) < 1 && Matter.Query.ray(map, pos, queryPoint).length == 0) circleCollisions.push(vertex)
            }
        }

        for (var i = 0; i < circleCollisions.length; i++) {
            const vertex = circleCollisions[i];
            var nextIndex = i + 1;
            if (nextIndex == circleCollisions.length) nextIndex = 0;
            const nextVertex = circleCollisions[nextIndex];
            const angle1 = Math.atan2(vertex.y - pos.y, vertex.x - pos.x);
            const angle2 = Math.atan2(nextVertex.y - pos.y, nextVertex.x - pos.x);
            var newAngle;
            if (Math.abs(angle1) > Math.PI / 2 && Math.abs(angle2) > Math.PI / 2 && angle1 / Math.abs(angle1) != angle2 / Math.abs(angle2)) {
                // if the arc between the to points crosses over the left side (+/- pi radians)
                const newAngle1 = (Math.PI - Math.abs(angle1)) * (angle1 / Math.abs(angle1));
                const newAngle2 = (Math.PI - Math.abs(angle2)) * (angle2 / Math.abs(angle2));
                newAngle = (newAngle1 + newAngle2) / 2;
                var multiplier;
                if (newAngle == 0) {
                    multiplier = 1;
                } else {
                    multiplier = newAngle / Math.abs(newAngle);
                }
                newAngle = Math.PI * multiplier - newAngle * multiplier;
                test = true;
            } else {
                newAngle = (angle1 + angle2) / 2;
            }

            // shoot ray between them
            var endPoint = {
                x: Math.cos(newAngle) * radius + pos.x,
                y: Math.sin(newAngle) * radius + pos.y
            }

            var best = getIntersections(pos, endPoint, map);

            vertices.push(vertex);

            if (best.dist <= radius) vertices.push({ x: best.x, y: best.y })
        }
        
        vertices.sort((a, b) => Math.atan2(a.y - pos.y, a.x - pos.x) - Math.atan2(b.y - pos.y, b.x - pos.x));
        return vertices;
    }
}