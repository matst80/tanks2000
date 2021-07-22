const tw = 100;
const th = 50;

export class LevelGenerator {
    generate(w = 1024, steps = 120) {
        // let currentH = wh;
        const points = [
            {x:-tw, y:-th}, 
            {x:tw, y:-th}, 
            {x:tw, y:th}, 
            {x:0, y:th*1.5}, 
            {x:-tw, y:th},
        ];

        const step = w / steps;
        
        // for (var i = 0; i <= steps; i++) {
        //     var yStep = (Math.random() * 20) - 10;

        //     points.push({x:step * i, y:currentH + yStep});
            
        //     currentH += yStep;
            
        // }
        return points;
    }
}