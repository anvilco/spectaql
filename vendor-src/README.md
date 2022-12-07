### What are `vendor-src` and `vendor` all about?

SpectaQL currently uses `grunt` as its task runner. Grunt supports plugins, and SpectaQL uses several plugins to do the things that it needs to do.
The problem is that many of those plugins are no longer maintained and have not been updated in years...like 7+ years in some cases. This leads to outdated packages and the occasional vulnerability.

So, for now SpectaQL has taken those packages "in house". Rather than maintain and publish many different forked repos and packages for the unmaintained plugins, they have been copied here and will be built and/or packaged up with the rest of SpectaQL in the `vendor` directory.

These source packages have no `dependencies` in their `package.json`, instead any dependencies are in the `peerDependencies` (as well as the `devDependencies`), and the actual dependencies have been added to SpectaQL's `package.json`'s `dependencies`. Any updates to those dependencies should be made in both places.
