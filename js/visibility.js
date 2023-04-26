const v = {
    draw() {
        for (const obj of map) {
            var visibilityVertices = [];
            var outerRays = [];
            for (var i = 0; i < obj.vertices.length; i++) {
                const pos = obj.vertices[i];
                const angle = Math.atan2(pos.y - m.pos.y, pos.x - m.pos.x);
                var endPoint = {
                    x: Math.cos(angle) * -1 + pos.x,
                    y: Math.sin(angle) * -1 + pos.y
                }
                const queryPoint = {
                    x: Math.cos(angle) + pos.x,
                    y: Math.sin(angle) + pos.y
                }
                var collisions = Matter.Query.ray([obj], m.pos, Matter.Vector.create(endPoint.x, endPoint.y));
                if (collisions.length == 0) {
                    visibilityVertices.push({ x: endPoint.x, y: endPoint.y })
                    if (Matter.Query.point([obj], queryPoint).length == 0) {
                        endPoint = {
                            x: Math.cos(angle) * 100000 + pos.x,
                            y: Math.sin(angle) * 100000 + pos.y
                        }

                        outerRays.push({
                            x1: queryPoint.x,
                            y1: queryPoint.y,
                            x2: endPoint.x,
                            y2: endPoint.y,
                            index: visibilityVertices.length - 1
                        })
                    }
                }
            }

            if (outerRays.length == 2) {
                var leftLine;
                var rightLine;
                if (outerRays[0].x1 > outerRays[1].x1) {
                    rightLine = outerRays[0];
                    leftLine = outerRays[1];
                } else {
                    rightLine = outerRays[1];
                    leftLine = outerRays[0];
                }
                function subArray(array, start, end) {
                    if (!end) end = array.length + 1;
                    var newArray = [...array];
                    return newArray.splice(start, end);
                }
                
                var newVertices;
                if (m.pos.y >= obj.position.y) {
                    visibilityVertices = subArray(visibilityVertices, 0, leftLine.index + 1).concat({ x: leftLine.x2, y: leftLine.y2 }, subArray(visibilityVertices, leftLine.index + 1));
                    if (rightLine.index > leftLine.index) rightLine.index++;
                    newVertices = ([{ x: rightLine.x2, y: rightLine.y2 }]).concat(subArray(visibilityVertices, rightLine.index), subArray(visibilityVertices, 0, rightLine.index));
                } else {
                    visibilityVertices = subArray(visibilityVertices, 0, rightLine.index + 1).concat({ x: rightLine.x2, y: rightLine.y2 }, subArray(visibilityVertices, rightLine.index + 1));
                    if (leftLine.index > rightLine.index) leftLine.index++;
                    newVertices = ([{ x: leftLine.x2, y: leftLine.y2 }]).concat(subArray(visibilityVertices, leftLine.index), subArray(visibilityVertices, 0, leftLine.index));
                }
                ctx.beginPath();
                ctx.moveTo(newVertices[0].x, newVertices[0].y);
                for (const vertex of newVertices) {
                    ctx.lineTo(vertex.x, vertex.y);
                }
                ctx.lineTo(newVertices[0].x, newVertices[0].y);
                ctx.fillStyle = '#000';
                ctx.fill();
            }
        }
    }
}