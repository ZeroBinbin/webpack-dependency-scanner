/**
 * Created by Administrator on 2017/2/17 0017.
 */
var Koa = require("koa");
var middleware = require("koa-webpack");
var config = require("./webpack.config.js");
var app = new Koa();
app.use(middleware({
    config : config
}))

app.listen(3000);