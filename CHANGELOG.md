# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1](https://github.com/tzachbon/mdview/compare/mdview-v1.2.0...mdview-v1.2.1) (2026-02-24)


### Bug Fixes

* **test:** reduce large content test size to prevent CI flakiness ([763fd60](https://github.com/tzachbon/mdview/commit/763fd605319c8367864b779ba6548b83899a6af0))

## [1.2.0](https://github.com/tzachbon/mdview/compare/mdview-v1.1.0...mdview-v1.2.0) (2026-02-24)


### Features

* **bat-style:** complete POC -- decorator + pager working ([bc091df](https://github.com/tzachbon/mdview/commit/bc091dff528ac0a609123f94797ce8d3388c5f12))
* **cli:** bat-style support ([#4](https://github.com/tzachbon/mdview/issues/4)) ([6fc4cb7](https://github.com/tzachbon/mdview/commit/6fc4cb72bd4d2e2025511efd5315df0651569d44))
* **cli:** extend parseArgs with --paging, --plain, --style flags ([23f750b](https://github.com/tzachbon/mdview/commit/23f750be4b2e667dbf0c6410e453f501e42fc89d))
* **cli:** wire decorator and pager into output pipeline ([96ca0e7](https://github.com/tzachbon/mdview/commit/96ca0e7ec0f04715960dc90a4885602820e7c208))
* **decorator:** add file header and grid border builders ([629e1cf](https://github.com/tzachbon/mdview/commit/629e1cffe12fd0b6df207df6c19899912aa8ce4b))
* **decorator:** add line number gutter with box-drawing separator ([b4755d1](https://github.com/tzachbon/mdview/commit/b4755d12bc53327a4f3903011ac1f94feda8b8f4))
* **decorator:** add parseStyle for --style flag parsing ([1acf3b8](https://github.com/tzachbon/mdview/commit/1acf3b8e72c0b2503302c4737f9ddc3e8559e3a2))
* **decorator:** assemble decorate() from header, numbers, grid ([2b55795](https://github.com/tzachbon/mdview/commit/2b5579596c08736375bff42b5adb7ac93affe66c))
* **pager:** add pipeToPager with fallback to stdout ([665c36e](https://github.com/tzachbon/mdview/commit/665c36e8bf635cc356f59ef9303e4904e7159a4b))
* **pager:** add shouldPage and resolvePagerCommand ([f752d2a](https://github.com/tzachbon/mdview/commit/f752d2af9bacac460017180d6dcaaa8e650ea59d))

## [1.1.0](https://github.com/tzachbon/mdview/compare/mdview-v1.0.0...mdview-v1.1.0) (2026-02-01)


### Features

* add shell installer and automated GitHub releases ([#1](https://github.com/tzachbon/mdview/issues/1)) ([5b97d6a](https://github.com/tzachbon/mdview/commit/5b97d6a807a162835c3d3e14481c87ab2068497d))
* **cli:** add CLI entry point with arg parsing ([609ae94](https://github.com/tzachbon/mdview/commit/609ae94681cd1e83ee9c0b3406ea6159dbf18035))
* complete POC - markdown + mermaid rendering works ([69576ea](https://github.com/tzachbon/mdview/commit/69576ea48347964df442ef162a4e301c19736904))
* **mermaid:** add mermaid to ASCII renderer ([96fccfd](https://github.com/tzachbon/mdview/commit/96fccfdbf320ba9f4dee988602b8635589321e44))
* **renderer:** add markdown renderer with mermaid support ([97d5359](https://github.com/tzachbon/mdview/commit/97d53592751de8f3a3addba903d4f049498437ee))


### Performance Improvements

* **cli:** optimize startup time for --version ([2666712](https://github.com/tzachbon/mdview/commit/266671242d37bd97b1a3cf225580a42799395a6c))

## [Unreleased]

## [1.0.0] - 2026-02-01

### Added

- Initial release
- Markdown rendering with full terminal styling
- Mermaid diagram support (flowcharts, sequence diagrams)
- Stdin input support (`mdview -`)
- Help and version flags
- Compiled binary support via `bun build --compile`
- Comprehensive test suite (82%+ coverage)

### Performance

- Startup time optimized to <50ms
