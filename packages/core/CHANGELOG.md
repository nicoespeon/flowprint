# Changelog

## [1.1.0](https://github.com/nicoespeon/flowprint/compare/flowprint-core-v1.0.0...flowprint-core-v1.1.0) (2026-04-08)


### Features

* add JSON and Mermaid output formats for CLI ([5e8f2d5](https://github.com/nicoespeon/flowprint/commit/5e8f2d530a175c77b3a85c780ee13a8135b9d35b))
* cross-file data flow tracing ([0882906](https://github.com/nicoespeon/flowprint/commit/0882906fcba89e0511d27d360ca137bcbb3ddb8e))
* downstream tracing (where does data go) ([8a12347](https://github.com/nicoespeon/flowprint/commit/8a123477f914c66e21bdcf2ef9c18b1e0016607f))
* downstream tracing for property access, chains, cross-file ([606010b](https://github.com/nicoespeon/flowprint/commit/606010b246b3c1a5d72cbc7965a51e0885728c6d))
* expose downstream tracing in VS Code extension ([2e0a0aa](https://github.com/nicoespeon/flowprint/commit/2e0a0aafb60ee13b071dbfc9d811767468354048))
* implement CLI for tracing data flow ([57a7054](https://github.com/nicoespeon/flowprint/commit/57a7054d1205f0b69be276dd63944138ebcf3294))
* initial project scaffold with first passing data flow test ([72da38f](https://github.com/nicoespeon/flowprint/commit/72da38f9808e2ac35ef45a830cb2abb45095cbc8))
* mark incomplete upstream traces with … indicator ([18d9fd7](https://github.com/nicoespeon/flowprint/commit/18d9fd7ce4ef0d4f336909d18654f6571e0ad3ed))
* origins mode — show only leaf nodes (data entry points) ([6873d60](https://github.com/nicoespeon/flowprint/commit/6873d60d10f1d9f84759584c61b42a0d47f502fa))
* populate location info in FlowNodes and add verbose text tree rendering ([1ea740c](https://github.com/nicoespeon/flowprint/commit/1ea740c70c80cae1bd44f0e3a20f8478dea3c666))
* scaffold VS Code extension with trace upstream command and tree view ([ff6110e](https://github.com/nicoespeon/flowprint/commit/ff6110eac3db679807196a8b9ca97299b482944a))
* trace both branches of ternary expressions ([b853432](https://github.com/nicoespeon/flowprint/commit/b853432690548c6b52eab8a16e38a94089630dac))
* trace function parameters to call-site arguments ([8dddb84](https://github.com/nicoespeon/flowprint/commit/8dddb842c6300ad95d93c3d4dc5b470744bf269f))
* trace parameters through arrow functions, function expressions, and callbacks ([10fa5cd](https://github.com/nicoespeon/flowprint/commit/10fa5cd56d2ea42c94ac645f8c2b6188f8531de4))
* trace property access expressions upstream ([50f7d75](https://github.com/nicoespeon/flowprint/commit/50f7d75fb8b75682b0979aba3529b39891a5b0e8))
* trace property access through object literal values ([30708da](https://github.com/nicoespeon/flowprint/commit/30708da3ada59e9a99ff0f851a92f25ac964bccc))
* trace through destructured variables and parameters ([7577484](https://github.com/nicoespeon/flowprint/commit/7577484e15d0d34056f094ae0a90c956c80ee6e2))
* trace through function return values ([7d438f7](https://github.com/nicoespeon/flowprint/commit/7d438f760213d9cccac5ec7813138b47835a603e))
* trace through method calls to their receiver object ([4e20c41](https://github.com/nicoespeon/flowprint/commit/4e20c419dd8eb9c73d37d7a496e6b8010805eb19))
* trace through shorthand properties in object literals ([52469fc](https://github.com/nicoespeon/flowprint/commit/52469fc75a3f7c555d2f125bc12a65fef1b02349))
* trace through spread elements in object literals ([9fd3da1](https://github.com/nicoespeon/flowprint/commit/9fd3da1bd929ee3091a75880b873be05d70df44c))
* VS Code extension with tree view, tsconfig auto-detection, and playground ([2b7a91b](https://github.com/nicoespeon/flowprint/commit/2b7a91bf803e812bbf440d053936bc8e976c5700))


### Bug Fixes

* handle out-of-bounds positions gracefully ([738779a](https://github.com/nicoespeon/flowprint/commit/738779a3e82cebd236cf91b6b8efe69d5fc03333))
* prevent infinite recursion with cycle detection in trace ([5e3d4ab](https://github.com/nicoespeon/flowprint/commit/5e3d4ab51e2f3343e2a5dfda6127ed19c95396fb))
* resolve identifier when cursor is at the end of the word ([c692206](https://github.com/nicoespeon/flowprint/commit/c69220652e51b5b0d8e1733db34617e655fe23ad))

## 1.0.0 (2026-04-08)


### Features

* add JSON and Mermaid output formats for CLI ([5e8f2d5](https://github.com/nicoespeon/flowprint/commit/5e8f2d530a175c77b3a85c780ee13a8135b9d35b))
* cross-file data flow tracing ([0882906](https://github.com/nicoespeon/flowprint/commit/0882906fcba89e0511d27d360ca137bcbb3ddb8e))
* downstream tracing (where does data go) ([8a12347](https://github.com/nicoespeon/flowprint/commit/8a123477f914c66e21bdcf2ef9c18b1e0016607f))
* downstream tracing for property access, chains, cross-file ([606010b](https://github.com/nicoespeon/flowprint/commit/606010b246b3c1a5d72cbc7965a51e0885728c6d))
* expose downstream tracing in VS Code extension ([2e0a0aa](https://github.com/nicoespeon/flowprint/commit/2e0a0aafb60ee13b071dbfc9d811767468354048))
* implement CLI for tracing data flow ([57a7054](https://github.com/nicoespeon/flowprint/commit/57a7054d1205f0b69be276dd63944138ebcf3294))
* initial project scaffold with first passing data flow test ([72da38f](https://github.com/nicoespeon/flowprint/commit/72da38f9808e2ac35ef45a830cb2abb45095cbc8))
* mark incomplete upstream traces with … indicator ([18d9fd7](https://github.com/nicoespeon/flowprint/commit/18d9fd7ce4ef0d4f336909d18654f6571e0ad3ed))
* origins mode — show only leaf nodes (data entry points) ([6873d60](https://github.com/nicoespeon/flowprint/commit/6873d60d10f1d9f84759584c61b42a0d47f502fa))
* populate location info in FlowNodes and add verbose text tree rendering ([1ea740c](https://github.com/nicoespeon/flowprint/commit/1ea740c70c80cae1bd44f0e3a20f8478dea3c666))
* scaffold VS Code extension with trace upstream command and tree view ([ff6110e](https://github.com/nicoespeon/flowprint/commit/ff6110eac3db679807196a8b9ca97299b482944a))
* trace both branches of ternary expressions ([b853432](https://github.com/nicoespeon/flowprint/commit/b853432690548c6b52eab8a16e38a94089630dac))
* trace function parameters to call-site arguments ([8dddb84](https://github.com/nicoespeon/flowprint/commit/8dddb842c6300ad95d93c3d4dc5b470744bf269f))
* trace parameters through arrow functions, function expressions, and callbacks ([10fa5cd](https://github.com/nicoespeon/flowprint/commit/10fa5cd56d2ea42c94ac645f8c2b6188f8531de4))
* trace property access expressions upstream ([50f7d75](https://github.com/nicoespeon/flowprint/commit/50f7d75fb8b75682b0979aba3529b39891a5b0e8))
* trace property access through object literal values ([30708da](https://github.com/nicoespeon/flowprint/commit/30708da3ada59e9a99ff0f851a92f25ac964bccc))
* trace through destructured variables and parameters ([7577484](https://github.com/nicoespeon/flowprint/commit/7577484e15d0d34056f094ae0a90c956c80ee6e2))
* trace through function return values ([7d438f7](https://github.com/nicoespeon/flowprint/commit/7d438f760213d9cccac5ec7813138b47835a603e))
* trace through method calls to their receiver object ([4e20c41](https://github.com/nicoespeon/flowprint/commit/4e20c419dd8eb9c73d37d7a496e6b8010805eb19))
* trace through shorthand properties in object literals ([52469fc](https://github.com/nicoespeon/flowprint/commit/52469fc75a3f7c555d2f125bc12a65fef1b02349))
* trace through spread elements in object literals ([9fd3da1](https://github.com/nicoespeon/flowprint/commit/9fd3da1bd929ee3091a75880b873be05d70df44c))
* VS Code extension with tree view, tsconfig auto-detection, and playground ([2b7a91b](https://github.com/nicoespeon/flowprint/commit/2b7a91bf803e812bbf440d053936bc8e976c5700))


### Bug Fixes

* handle out-of-bounds positions gracefully ([738779a](https://github.com/nicoespeon/flowprint/commit/738779a3e82cebd236cf91b6b8efe69d5fc03333))
* prevent infinite recursion with cycle detection in trace ([5e3d4ab](https://github.com/nicoespeon/flowprint/commit/5e3d4ab51e2f3343e2a5dfda6127ed19c95396fb))
* resolve identifier when cursor is at the end of the word ([c692206](https://github.com/nicoespeon/flowprint/commit/c69220652e51b5b0d8e1733db34617e655fe23ad))
