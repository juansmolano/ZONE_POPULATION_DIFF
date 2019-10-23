'use strict'

const xlsxj = require("xlsx-to-json");

xlsxj({
    input: "input.xlsx",
    output: "input.json"
}, function (err, result) {
    if (err) {
        console.error(err);
    } else {
        console.log(result);
    }
});