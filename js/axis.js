class Axis {
    constructor(title="AxisTitle", abbr="Abbr.",
                display="number", access=null) {
        this.title = title
        this.abbr = abbr
        if (this.access == null) {
            this.access = function (p) {return p[this.abbr]}
        } else {
            this.access = access
        }
        if (display == "number") {
            this.display = function (d) {return d}
        } else if (display == "pct") {
            this.display = function (d) {return `${d}%`}
        } else {
            this.display = function (d) {return d.toFixed(3)}
        }
    }
}

// What axes are available?
let axes_dict = {
    s2avg: new Axis("2-Strike Average", "s2avg"),
    s2slg: new Axis("2-Strike Slugging", "s2slg"),
    s2babip: new Axis("2-Strike BABIP", "s2babip"),
    s2iso: new Axis("2-Strike Iso", "s2iso"),
    s2woba: new Axis("2-Strike wOBA", "s2woba"),
    s2abs: new Axis("2-Strike At Bats", "s2abs", "number"),
    pa: new Axis("Plate Appearances", "pa", "number"),
    kpct: new Axis("Strikeout Pct.", "kpct", "pct"),
    bbpct: new Axis("Walk Pct.", 'bbpct', "pct"),
    avg: new Axis("Overall Average", 'avg'),
    slg: new Axis("Overall Slugging", 'slg'),
    obp: new Axis("Overall OBP", 'obp'),
    ozspct: new Axis("Chase Rate", 'ozspct', "pct"),
    whiffpct: new Axis("Whiff Pct.", 'whiffpct', "pct"),
    swpct: new Axis('Swing Pct.', 'swpct', "pct")
}