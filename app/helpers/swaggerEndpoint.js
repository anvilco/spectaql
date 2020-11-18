/**
* Copyright (c) 2015 Nils Knappmeier
* https://github.com/bootprint/bootprint-openapi
*
* @license MIT
**/

module.exports = function(options) {
  var data = options.data.root;
  return data.servers.map(server =>
    `${server.description
      ? server.description.trim()
      : "Endpoint:"}:\n${server.url
        ? server.url.trim()
        : "<<url is missing>>"}\n`).join("");
};
