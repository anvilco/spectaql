In your project's Gruntfile, add a section named `prettify` to the data object passed into `grunt.initConfig()`.

```javascript
grunt.initConfig({
  prettify: {
    options: {
      // Task-specific options go here.
    },
    html: {
      // Target-specific file lists and/or options go here.
    }
  }
});
```