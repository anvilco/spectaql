- `typesDocumented` option renamed to `objectsDocumentedDefault`.
- `typeDocumentedDefault` option renamed to `objectDocumentedDefault`
- `hideFieldsWithUndocumentedReturnType` option was renamed to `hideFieldsOfUndocumentedType`.
- `x-swaggerUrl` renamed to `x-url`

The Dynamic Example Generators has been completely re-worked. If used, your module is expected to export a single function. That function will be provided all the information it should need to what it is, where it's being used, and what you'd like to return as an example value. Check out `examples/customizations/examples/index.js` for more information.

New options/features:

- `hideFieldsOfUndocumentedType`
- `hideArgsOfUndocumentedType`
- `hideInputFieldsOfUndocumentedType`
- `extensions.graphqlScalarExamples`
