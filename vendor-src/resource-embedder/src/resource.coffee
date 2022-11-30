###
  resource-embedder
  https://github.com/callumlocke/resource-embedder

  Copyright 2013 Callum Locke
  Licensed under the MIT license
###

parseFileSize = require './parse-file-size'
fs = require 'fs'
path = require 'path'
reorientCSS = require 'reorient-css'

module.exports = class Resource
  constructor: (@tagName, @attributes, @options) ->

  isEmbeddable: (callback) ->
    if @embed?
      callback @embed
    else
      if @potentiallyEmbeddable()
        threshold = @getThreshold()
        if !threshold
          callback @embed = false
        else
          @getContentsForEmbedding (notFound, missingFilePath) =>
            if (notFound)
              @warning = "File does not exist: #{missingFilePath}"
              callback @embed = false
            else
              callback @embed = (threshold > @getByteLength())
      else
        callback @embed = false

  potentiallyEmbeddable: (tagName=@tagName, attributes=@attributes, options=@options) ->
    # Aims to return false as quickly as possible if we can be sure it's NOT embeddable
    # based solely on tagName, attributes, or options (NB: we're not checking the
    # threshold yet). Otherwise returns true, meaning it *might* be embeddable (as far as
    # we can tell without looking at the file contents).
    switch tagName
      when 'script'
        @target = attributes.src
        return false if (
          !options.scripts ||
          !(
            switch attributes.type
              when null, undefined, '', 'application/javascript', 'text/javascript'
                true
              else false
          ) ||
          attributes.defer? ||
          attributes.async? ||
          !Resource::isLocalPath(attributes.src)
        )
      when 'link'
        @target = attributes.href
        return false if (
          !options.stylesheets ||
          attributes.rel != 'stylesheet' ||
          !(
            switch attributes.media
              when null, undefined, '', 'all'
                true
              else false
          ) ||
          !Resource::isLocalPath(attributes.href)
        )
      else
        return false
    return true

  getThreshold: (embedAttr = @attributes?['data-embed'], options=@options) ->
    switch embedAttr
      when 'false', '0' then 0
      when null, undefined then parseFileSize options.threshold
      when '' then Infinity
      else parseFileSize embedAttr

  getContentsForEmbedding: (callback) ->
    # Returns the contents of the file, but trimmed, and run through reorient-css
    # (if CSS).
    relFilePath = (if @tagName is 'script' then @attributes.src else @attributes.href)
    @fullFilePath = path.resolve(path.join(@options.assetRoot, relFilePath))
    fs.exists @fullFilePath, (exists) =>
      if !exists
        callback(true, @fullFilePath) # true means error (file not found)
      else
        fs.readFile @fullFilePath, (err, @contents) =>
          throw err if err
          if @tagName is 'link'
            @cssDirName = path.dirname @attributes.href
            @contents = reorientCSS(
              @contents.toString(),
              @fullFilePath
              @options.htmlFile
            ).css
          @contents = @contents.toString().trim()
          callback()

  getByteLength: (contents=@contents) ->
    if !contents?
      throw new Error 'UNDEFINED @contents for some reason!'
    if typeof contents is 'string'
      Buffer.byteLength(contents, 'utf8')
    else
      contents.length

  isLocalPath: (filePath, mustBeRelative=false) ->
    (
      filePath && filePath.length &&
      (filePath.indexOf('//') == -1) &&
      (filePath.indexOf('data:') != 0) &&
      (!mustBeRelative || filePath[0] != '/')
    )
