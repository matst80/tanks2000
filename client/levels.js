const tw = 1024;
const th = 300;

export class LevelGenerator {
    generate(w = 1024, steps = 120) {
        let currentH = 0;
        const points = []

        const step = w / steps;

        for (var i = 0; i <= steps; i++) {
            var yStep = 0;//(Math.random() * 10) - 5;

            points.push({
                x: step * i,
                y: currentH + yStep
            });

            currentH += yStep;
        }

        points.push({x:w, y:th},{x:0,y:th})
        return points
    }
}