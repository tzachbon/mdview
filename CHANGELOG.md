# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
