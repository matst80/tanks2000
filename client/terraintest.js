let terraindata = {
    seed: 0,
    width: 60,
    height: 10,
    threshold: 128,
    previewScale: 20,
    cells: [],
    pois: [],
    vectors: [],
    lines: [],
    debug: [],
}

let can1
let ctx1

let can2
let ctx2

async function useBrush(data, multiplier=1.0) {
    if (!data.brush) {
        return
    }

    var oi = 0
    for(var j=0; j<data.height; j++) {
        for(var i=0; i<data.width; i++) {
            const dx = i - data.brush.x
            const dy = j - data.brush.y
            const dd = Math.sqrt(dx*dx + dy*dy)
            const n = noise.simplex3(i / 5.0, j / 5.0, 1337) / 3.0

            let radiidelta = Math.max(0, data.brush.size - (dd + n))

            let amt = dd - 0.5
            if (amt > 0.0) {

            }

            let v = data.cells[oi]
            // if (dd < data.brush.size) {
            v += data.brush.power * radiidelta * multiplier
            // }
            v = Math.max(0, Math.min(255, v))
            data.cells[oi ++] = v
        }
    }
}

async function updateRawPreview(data) {

    ctx1.fillStyle = '#333'
    ctx1.fillRect(0, 0, data.width, data.height)

    const img = ctx1.getImageData(0, 0, data.width, data.height)
    let oi = 0
    let oo = 0
    for(var j=0; j<data.height; j++) {
        for(var i=0; i<data.width; i++) {
            const v = data.cells[oi ++]
            img.data[oo ++] = v
            img.data[oo ++] = v
            img.data[oo ++] = 0
            img.data[oo ++] = 255
        }
    }
    ctx1.putImageData(img, 0, 0)

    if (data.brush) {
        ctx1.strokeStyle = '#f00'
        ctx1.beginPath()
        ctx1.ellipse( data.brush.x, data.brush.y, data.brush.size, data.brush.size, 0, 0, Math.PI * 2 )
        ctx1.stroke()
    }
}

async function updateOutputPreview(data) {

    ctx2.fillStyle = '#333'
    ctx2.fillRect(0, 0, data.width * data.previewScale, data.height * data.previewScale)


    for(var j=0; j<data.height; j++) {
        for(var i=0; i<data.width; i++) {
            const v = data.cells[j * data.width + i]
            if (v > data.threshold) {
                const r = data.previewScale / 2.0
                ctx2.fillStyle = '#888'
                ctx2.fillRect( i * data.previewScale - data.previewScale / 4, j * data.previewScale - data.previewScale / 4, data.previewScale / 2, data.previewScale / 2)
            }
        }
    }

    ctx2.font = "10px Arial";
    ctx2.fillStyle = '#ccc'
    for(var j=0; j<data.height-1; j++) {
        for(var i=0; i<data.width-1; i++) {
            const v = data.debug[j * data.width + i]
            if (v != 0 && v != 15) {
                ctx2.fillText(`${v}`, i * data.previewScale + 2, j * data.previewScale + 10, );
            }
        }
    }

    ctx2.strokeStyle = '#fff'
    for(var j=0; j<data.height; j++) {
        for(var i=0; i<data.width; i++) {
            ctx2.beginPath()
            ctx2.moveTo( i * data.previewScale, j * data.previewScale )
            ctx2.lineTo( i * data.previewScale + 1, j * data.previewScale + 1 )
            ctx2.stroke()
        }
    }

    ctx2.strokeStyle = '#0f0'
    for(var j=0; j<data.lines.length; j++) {
        const l = data.lines[j]
        ctx2.beginPath()
        ctx2.moveTo(l[0], l[1])
        ctx2.lineTo(l[2], l[3])
        ctx2.stroke()
    }

    if (data.brush) {
        ctx2.strokeStyle = '#f00'
        ctx2.beginPath()
        ctx2.ellipse( data.brush.x * data.previewScale, data.brush.y * data.previewScale, data.brush.size * data.previewScale, data.brush.size * data.previewScale, 0, 0, Math.PI * 2 )
        ctx2.stroke()
    }
}

async function regenerateRaw(data) {
    data.cells = []
    data.pois = []
    data.lines = []
    data.debug = []

    noise.seed(data.seed)

    for(var j=0; j<data.height; j++) {
        for(var i=0; i<data.width; i++) {
            // big "columns"
            var p1 = 0.5 + 0.5 * noise.simplex3(i / 15.0, j / 100.0, 0)
            // smaller noise
            var p2 = 0.5 + 0.5 * noise.simplex3(i / 13.0, j / 11.0, 0)
            var p3 = ((j / data.height) - 0.5) * 1.1
            var pp = Math.max(0, Math.min(1, ((p1 * p2) + p3)))

            data.cells[j * data.width + i] = pp * 255 // Math.floor(Math.random() * 255)
        }
    }
}

function interpedge(t0, t1, v0, v1, threshold) {
    var y0 = (t0 - threshold) / 128.0
    var y1 = (t1 - threshold) / 128.0

    var slope = y1 - y0
    if (slope > -0.0001 && slope < 0.0001) {
        return v0
    }

    var r = 1.0 - (-y0 / slope)

    r = Math.max(0, Math.min(1, r))

    return (v0 * r) + (v1 * (1.0 - r))
}

async function regenerateOutput(data) {
    // Classic demo stuff, but in 2d! https://en.wikipedia.org/wiki/Marching_squares
    const lines = []
    for(var j=0; j<data.height - 1; j++) {
        for(var i=0; i<data.width - 1; i++) {
            const x0 = i * data.previewScale
            const x1 = i * data.previewScale + data.previewScale
            const y0 = j * data.previewScale
            const y1 = j * data.previewScale + data.previewScale

            const val_tl = data.cells[(j + 0) * data.width + (i + 0)]
            const val_tr = data.cells[(j + 0) * data.width + (i + 1)]
            const val_bl = data.cells[(j + 1) * data.width + (i + 0)]
            const val_br = data.cells[(j + 1) * data.width + (i + 1)]

            const iso_tl = val_tl > data.threshold
            const iso_tr = val_tr > data.threshold
            const iso_bl = val_bl > data.threshold
            const iso_br = val_br > data.threshold

            const bitmask = (iso_bl ? 1 : 0) + (iso_br ? 2 : 0) + (iso_tr ? 4 : 0) + (iso_tl ? 8 : 0)
            data.debug[j * data.width + i] = bitmask

            switch (bitmask) {
                case 0:
                    // all empty, no lines, ignore
                    break;
                case 1:
                    {
                        // from bottom left
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        let tl = interpedge(val_bl, val_tl, y1, y0, data.threshold)
                        lines.push([ x0, tl, tb, y1 ])
                        break;
                    }
                case 2:
                    {
                        // from bottom right
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        let tr = interpedge(val_br, val_tr, y1, y0, data.threshold)
                        lines.push([ tb, y1, x1, tr ])
                        break;
                    }
                case 3:
                    {
                        // from bottom edge
                        let tl = interpedge(val_tl, val_bl, y0, y1, data.threshold)
                        let tr = interpedge(val_tr, val_br, y0, y1, data.threshold)
                        lines.push([ x0, tl, x1, tr ])
                        break;
                    }
                case 4:
                    {
                        // from top right
                        let tt = interpedge(val_tr, val_tl, x1, x0, data.threshold)
                        let tr = interpedge(val_tr, val_br, y0, y1, data.threshold)
                        lines.push([ tt, y0, x1, tr ])
                        break;
                    }
                case 5:
                    {
                        // from top right and bottom left
                        let tt = interpedge(val_tr, val_tl, x1, x0, data.threshold)
                        let tr = interpedge(val_tr, val_br, y0, y1, data.threshold)
                        lines.push([ tt, y0, x1, tr ])
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        let tl = interpedge(val_bl, val_tl, y1, y0, data.threshold)
                        lines.push([ x0, tl, tb, y1 ])
                        break;
                    }
                case 6:
                    {
                        // from right edge
                        let tt = interpedge(val_tl, val_tr, x0, x1, data.threshold)
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        lines.push([ tt, y0, tb, y1 ])
                        break;
                    }
                case 7:
                    {
                        // to top left
                        let tt = interpedge(val_tr, val_tl, x1, x0, data.threshold)
                        let tl = interpedge(val_bl, val_tl, y1, y0, data.threshold)
                        lines.push([ tt, y0, x0, tl ])
                        break;
                    }
                case 8:
                    {
                        // from top left
                        let tt = interpedge(val_tl, val_tr, x0, x1, data.threshold)
                        let tl = interpedge(val_tl, val_bl, y0, y1, data.threshold)
                        lines.push([ tt, y0, x0, tl ])
                        break;
                    }
                case 9:
                    {
                        // from left edge
                        let tt = interpedge(val_tl, val_tr, x0, x1, data.threshold)
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        lines.push([ tt, y0, tb, y1 ])
                        break;
                    }
                case 10:
                    {
                        // from top left and bottom right
                        let tt = interpedge(val_tl, val_tr, x0, x1, data.threshold)
                        let tl = interpedge(val_tl, val_bl, y0, y1, data.threshold)
                        lines.push([ tt, y0, x0, tl ])
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        let tr = interpedge(val_br, val_tr, y1, y0, data.threshold)
                        lines.push([ tb, y1, x1, tr ])
                        break;
                    }
                case 11:
                    {
                        // to top right
                        let tt = interpedge(val_tl, val_tr, x0, x1, data.threshold)
                        let tr = interpedge(val_br, val_tr, y1, y0, data.threshold)
                        lines.push([ tt, y0, x1, tr ])
                        break;
                    }
                case 12:
                    {
                        // from top edge
                        let tl = interpedge(val_tl, val_bl, y0, y1, data.threshold)
                        let tr = interpedge(val_tr, val_br, y0, y1, data.threshold)
                        lines.push([ x0, tl, x1, tr ])
                        break;
                    }
                case 13:
                    {
                        // to bottom right
                        let tb = interpedge(val_bl, val_br, x0, x1, data.threshold)
                        let tr = interpedge(val_tr, val_br, y0, y1, data.threshold)
                        lines.push([ tb, y1, x1, tr ])
                        break;
                    }
                case 14:
                    {
                        // to bottom left
                        let tb = interpedge(val_br, val_bl, x1, x0, data.threshold)
                        let tl = interpedge(val_tl, val_bl, y0, y1, data.threshold)
                        lines.push([ tb, y1, x0, tl ])
                        break;
                    }
                case 15:
                    // all filled, no lines, ignore
                    break;
            }
        }
    }

    data.lines = lines
}

async function regenerate() {
    terraindata.width = ~~document.getElementById('width').value
    terraindata.height = ~~document.getElementById('height').value
    terraindata.seed = ~~document.getElementById('seed').value
    terraindata.cells = []
    terraindata.pois = []
    terraindata.lines = []

    can1.width = terraindata.width
    can1.height = terraindata.height
    ctx1.width = terraindata.width
    ctx1.height = terraindata.height

    can2.width = terraindata.width * terraindata.previewScale
    can2.height = terraindata.height * terraindata.previewScale
    ctx2.width = terraindata.width * terraindata.previewScale
    ctx2.height = terraindata.height * terraindata.previewScale

    console.log('json before', terraindata)

    await regenerateRaw(terraindata)
    await regenerateOutput(terraindata)
    await updateRawPreview(terraindata)
    await updateOutputPreview(terraindata)
}


window.addEventListener('load', () => {
    console.log('loaded')

    can1 = document.getElementById('c1')
    ctx1 = can1.getContext('2d')

    let pendown = false

    can1.addEventListener('mousemove', async e => {
        terraindata.brush = {
            x: e.layerX + 0.5,
            y: e.layerY + 0.5,
            size: ~~document.getElementById('brushradius').value,
            power: ~~document.getElementById('brushpower').value,
            noise: ~~document.getElementById('brushnoise').value,
        }
        if (pendown) {
            await useBrush(terraindata, 0.1)
        }
        await updateRawPreview(terraindata)
    })
    can1.addEventListener('mousedown', async e => {
        pendown = true
        await useBrush(terraindata, 0.1)
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
    })
    can1.addEventListener('mouseup', async e => {
        pendown = false
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })
    can1.addEventListener('mouseout', async e => {
        pendown = false
        terraindata.brush = null
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })

    can2 = document.getElementById('c2')
    ctx2 = can2.getContext('2d')

    can2.addEventListener('mousemove', async e => {
        terraindata.brush = {
            x: e.layerX / terraindata.previewScale,
            y: e.layerY / terraindata.previewScale,
            size: ~~document.getElementById('brushradius').value,
            power: ~~document.getElementById('brushpower').value,
            noise: ~~document.getElementById('brushnoise').value,
        }
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })
    can2.addEventListener('mousedown', async e => {
        pendown = true
        await useBrush(terraindata)
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })
    can2.addEventListener('mouseup', async e => {
        pendown = false
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })
    can2.addEventListener('mouseout', async e => {
        pendown = false
        terraindata.brush = null
        await regenerateOutput(terraindata)
        await updateRawPreview(terraindata)
        await updateOutputPreview(terraindata)
    })

    document.getElementById('randomize').addEventListener('click', () => {
        document.getElementById('seed').value = Math.floor(Math.random() * 1000000)
        regenerate();
    });

    document.getElementById('generate').addEventListener('click', () => {
        regenerate();
    });

    regenerate()
    updateRawPreview()
    updateOutputPreview()
})
