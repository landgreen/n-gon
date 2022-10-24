//   https://ncase.me/sight-and-light/
//   redblobgames.com/articles/visibility
//   https://github.com/Silverwolf90/2d-visibility/tree/master/src
//   could apply to explosions, neutron bomb, player LOS


const v = {
    points: [],
    populate() {
        v.points = [{
            x: -150,
            y: -950
        }, {
            x: 710,
            y: -950
        }, {
            x: 710,
            y: -940
        }, {
            x: 710,
            y: -710
        }, {
            x: 710,
            y: -700
        }, {
            x: -150,
            y: -700
        }]
    },
    draw() {
        ctx.beginPath();
        ctx.moveTo(v.points[0].x, v.points[0].y)
        for (let i = 0, len = v.points.length; i < len; i++) {
            ctx.lineTo(v.points[i].x, v.points[i].y)
        }
        // ctx.fillStyle = "#333"
        ctx.globalCompositeOperation = "destination-in";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.clip();
    }
}
v.populate();
// console.log(v.points)