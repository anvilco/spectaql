###
  resource-embedder
  https://github.com/callumlocke/resource-embedder

  Copyright 2013 Callum Locke
  Licensed under the MIT license.
###

fs = require 'graceful-fs'
path = require 'path'
htmlparser = require 'htmlparser2'
assign = require('lodash').assign
Resource = require './resource'
getLineIndent = require './get-line-indent'
parseFileSize = require './parse-file-size'

defaults =
  threshold: '5KB'
  stylesheets: true
  scripts: true
  deleteEmbeddedFiles: false

indentEachLine = (str, indent) ->
  lines = str.split '\n'
  indent + lines.join "\n#{indent}"

module.exports = class ResourceEmbedder
  constructor: (_options) ->
    # Normalise arguments
    if typeof _options is 'string'
      htmlFile = arguments[0]
      _options = arguments[1] || {}
      _options.htmlFile = htmlFile

    # Build options
    @options = assign {}, defaults, _options
    @options.htmlFile = path.resolve @options.htmlFile
    if not @options.assetRoot
      @options.assetRoot = path.dirname(@options.htmlFile) unless @options.assetRoot?
    @options.assetRoot = path.resolve @options.assetRoot
    if typeof @options.threshold isnt 'number'
      @options.threshold = parseFileSize @options.threshold

  get: (callback) ->
    fs.readFile @options.htmlFile, (err, inputMarkup) =>
      throw err if err

      inputMarkup = inputMarkup.toString()
      embeddableResources = {}
      tagCounter = 1
      finished = false
      warnings = []

      doEmbedding = =>
        for own k, er of embeddableResources
          return if !er.body? || !er.elementEndIndex?

        outputMarkup = ''
        index = 0
        for own k, er of embeddableResources
          er.body = er.body.toString()

          multiline = (er.body.indexOf('\n') isnt -1)
          if multiline
            indent = getLineIndent er.elementStartIndex, inputMarkup
          else indent = ''

          body = (if indent.length then indentEachLine(er.body, indent) else er.body)

          outputMarkup += (
            inputMarkup.substring(index, er.elementStartIndex) +
            "<#{er.type}>" +
            (if multiline then '\n' else '') +
            body +
            (if multiline then '\n' else '') +
            indent + "</#{er.type}>"
          )
          index = er.elementEndIndex + 1
          
          if @options.deleteEmbeddedFiles && fs.existsSync er.path
            fs.unlinkSync er.path

        outputMarkup += inputMarkup.substring index

        callback outputMarkup, (if warnings.length then warnings else null)

      parser = new htmlparser.Parser
        onopentag: (tagName, attributes) =>
          tagCounter++
          thisTagId = tagCounter
          startIndexOfThisTag = parser.startIndex
          resource = new Resource tagName, attributes, @options
          resource.isEmbeddable (embed) =>
            if embed
              if !embeddableResources[thisTagId]?
                embeddableResources[thisTagId] = {}
              er = embeddableResources[thisTagId]
              er.body = resource.contents
              er.type = (if tagName is 'script' then 'script' else 'style')
              er.path = path.resolve path.join(@options.assetRoot, resource.target)
              er.elementStartIndex = startIndexOfThisTag
            else
              warnings.push resource.warning if resource.warning?
              process.nextTick -> delete embeddableResources[thisTagId]
            if finished
              process.nextTick doEmbedding

        onclosetag: (tagName) ->
          switch tagName
            when 'script', 'link'
              if !embeddableResources[tagCounter]?
                embeddableResources[tagCounter] = {}
              er = embeddableResources[tagCounter]
              er.elementEndIndex = parser.endIndex
          if finished
            throw new Error 'Should never happen!'

        onend: ->
          finished = true

      parser.write(inputMarkup)
      parser.end()
