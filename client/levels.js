export class LevelGenerator {
    generate(w = 60, steps = 120) {
        const points = [];
        const step = w / steps;
        let currentH = 10;
        for (var i = 0; i <= steps; i++) {
            var yStep = (Math.random() * 2) - 1;

            points.push([step * i, currentH + yStep]);
            
            currentH += yStep;
            
        }
        return points;
    }
}