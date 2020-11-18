var Handlebars = require('handlebars')

module.exports = function (value, options) {
    const query = value.example;
    const variables = null
    const variablesQuery = variables ? `&variables=${encodeURIComponent(variables)}` : ""
    var url = `${options.data.root.servers[0].url}?query=${encodeURIComponent(query)}${variablesQuery}`;
    return new Handlebars.SafeString(`<a href="${url}" target="_blank">Try it now<a/>\n`);
}