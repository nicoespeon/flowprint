# Changelog

## [0.2.2](https://github.com/nicoespeon/flowprint/compare/flowprint-v0.2.1...flowprint-v0.2.2) (2026-04-08)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @flowprint/core bumped to 1.1.0

## [0.2.1](https://github.com/nicoespeon/flowprint/compare/flowprint-v0.2.0...flowprint-v0.2.1) (2026-04-08)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @flowprint/core bumped to 1.0.0

## [0.2.0](https://github.com/nicoespeon/flowprint/compare/flowprint-v0.1.0...flowprint-v0.2.0) (2026-04-07)


### Features

* add JSON and Mermaid output formats for CLI ([5e8f2d5](https://github.com/nicoespeon/flowprint/commit/5e8f2d530a175c77b3a85c780ee13a8135b9d35b))
* downstream tracing (where does data go) ([8a12347](https://github.com/nicoespeon/flowprint/commit/8a123477f914c66e21bdcf2ef9c18b1e0016607f))
* origins mode — show only leaf nodes (data entry points) ([6873d60](https://github.com/nicoespeon/flowprint/commit/6873d60d10f1d9f84759584c61b42a0d47f502fa))

## [0.1.0](https://github.com/nicoespeon/flowprint/compare/flowprint-v0.0.1...flowprint-v0.1.0) (2026-03-27)


### Features

* implement CLI for tracing data flow ([57a7054](https://github.com/nicoespeon/flowprint/commit/57a7054d1205f0b69be276dd63944138ebcf3294))
* initial project scaffold with first passing data flow test ([72da38f](https://github.com/nicoespeon/flowprint/commit/72da38f9808e2ac35ef45a830cb2abb45095cbc8))
* show locations by default in CLI output, add --compact flag ([5429b15](https://github.com/nicoespeon/flowprint/commit/5429b15468513ef1b07d4da708c9ba4b9a5cb1bf))


### Bug Fixes

* handle out-of-bounds positions gracefully ([738779a](https://github.com/nicoespeon/flowprint/commit/738779a3e82cebd236cf91b6b8efe69d5fc03333))
* reject --direction downstream until implemented ([c8bc2c4](https://github.com/nicoespeon/flowprint/commit/c8bc2c4b4f39a9efb2cc5b1453c4e95ecebf9290))
