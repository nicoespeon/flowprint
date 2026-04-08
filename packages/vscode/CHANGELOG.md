# Changelog

## [0.3.1](https://github.com/nicoespeon/flowprint/compare/flowprint-vscode-v0.3.0...flowprint-vscode-v0.3.1) (2026-04-08)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @flowprint/core bumped to 1.1.0

## [0.3.0](https://github.com/nicoespeon/flowprint/compare/flowprint-vscode-v0.2.0...flowprint-vscode-v0.3.0) (2026-04-08)


### Features

* show … suffix on incomplete nodes in VS Code tree view ([8f069d0](https://github.com/nicoespeon/flowprint/commit/8f069d0b1d25fa8f3628de1cff161ce1d49818d7))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @flowprint/core bumped to 1.0.0

## [0.2.0](https://github.com/nicoespeon/flowprint/compare/flowprint-vscode-v0.1.0...flowprint-vscode-v0.2.0) (2026-04-07)


### Features

* expose downstream tracing in VS Code extension ([2e0a0aa](https://github.com/nicoespeon/flowprint/commit/2e0a0aafb60ee13b071dbfc9d811767468354048))
* origins mode — show only leaf nodes (data entry points) ([6873d60](https://github.com/nicoespeon/flowprint/commit/6873d60d10f1d9f84759584c61b42a0d47f502fa))
* show origins in persistent tree view instead of QuickPick ([c81bd0b](https://github.com/nicoespeon/flowprint/commit/c81bd0be9317212387c7aa33080bf721816f492c))

## [0.1.0](https://github.com/nicoespeon/flowprint/compare/flowprint-vscode-v0.0.1...flowprint-vscode-v0.1.0) (2026-03-27)


### Features

* initial project scaffold with first passing data flow test ([72da38f](https://github.com/nicoespeon/flowprint/commit/72da38f9808e2ac35ef45a830cb2abb45095cbc8))
* prepare VS Code extension for marketplace publishing ([c7a3031](https://github.com/nicoespeon/flowprint/commit/c7a3031d3fb8482f0c38c189e0fc8ad3817aa194))
* scaffold VS Code extension with trace upstream command and tree view ([ff6110e](https://github.com/nicoespeon/flowprint/commit/ff6110eac3db679807196a8b9ca97299b482944a))
* VS Code extension with tree view, tsconfig auto-detection, and playground ([2b7a91b](https://github.com/nicoespeon/flowprint/commit/2b7a91bf803e812bbf440d053936bc8e976c5700))


### Bug Fixes

* align engines.vscode with @types/vscode, prevent dependabot drift ([866f401](https://github.com/nicoespeon/flowprint/commit/866f401f290d6e207d4e0cb10d0057a730c2bf32))
* place context menu item in same group as Find All References ([8b1d468](https://github.com/nicoespeon/flowprint/commit/8b1d468c790ff28e7838fa2dcfb4843dced04345))
* use Bundler module resolution for vscode package to fix editor TS errors ([9f1137c](https://github.com/nicoespeon/flowprint/commit/9f1137c76d46f708c15f73c511298d9ad0768baa))
* use selection start instead of active position for tracing ([57bfaae](https://github.com/nicoespeon/flowprint/commit/57bfaaebb708157fd7e99950b98bb554cfbb486b))
