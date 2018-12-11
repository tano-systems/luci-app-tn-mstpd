# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

All dates in this document are in `DD.MM.YYYY` format.

### Unreleased
### Added
- Hide additional information toggle button before first data is arrived.

### Fixed
- Fixed port state and role appearance in status table.

## 1.2.0 - 09.12.2018
### Added
- This CHANGELOG file.
- Operative protocol version display in the bridge ports status table.
- Show/hide additional information button for bridge ports status table.

### Changed
- Global application code rework (mostly in JavaScript of the templates).
- Renamed "Protocol" bridge state parameter to "Administrative protocol version".
- Now status pages for bridges displayed as tabs (3rd menu level).
- Bridge status displayed as a list, not a table, as it was early.
- Minor bridge ports status table display improvements.
- Updated screenshots.

## 1.1.0 - 05.12.2018
### Fixed
- Fixed application for multiple bridges configurations.

## 1.0.4 - 05.12.2018
### Changed
- Merged status and config menu items as 3rd level pages under "Services"
  main menu item.

### Fixed
- Fixed typography in Russian translation.

## 1.0.3 - 02.12.2018
### Fixed
- Fixed bridges select width on config page. This widget produced
  an incorrect UCI config then saved.

## 1.0.2 - 23.11.2018
### Removed
- Removed service status display on status and config pages.

## 1.0.1 - 31.10.2018
### Added
- Added support for LuCI from OpenWrt 18.06.x branch.
- Added screenshots to README.md.

### Fixed
- Minor bugfixes.
- Fixed invalid HTML markup in footer.

## 1.0.0 - 04.07.2018

Initial release
