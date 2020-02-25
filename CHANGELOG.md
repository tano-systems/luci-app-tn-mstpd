# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

All dates in this document are in `DD.MM.YYYY` format.

## [Unreleased]
### Added
- Added support for the official OpenWrt and Material LuCI themes.
  Previously supported only Bootstrap LuCI theme.
- Hide additional information toggle button before first data is arrived.
- Display last topology change port and topology change count parameters
  for bridge.
- Added spinner for messages about waiting for data.
- Removed useless ucitrack definition
- Allow to hide footer by UCI option 'luci.app_tn_mstpd.hide_footer'

### Changed
- Application main menu entry has been renamed to "STP/RSTP".
- Renamed some titles on application pages.
- Human readable display for time since topology change.
- Use polling interval from LuCI configuration (luci.main.pollinterval)
- Use L.Poll.add() instead of deprecated XHR.Poll() for data polling.

### Fixed
- Fixed bridge and bridge port name fields value dipslay in settings.
- Fixed Russian translation.
- Fixed port state and role appearance in status table.
- Do not show status tabs for bridges that are removed from the network
  configuration but present in the mstpd configuration.
- Create UCI sections for newly added bridges under the MSTPd control only
  if they are not exists.
- Fixed alert messages for various themes.
- Fixed bridges tab menu in status view.

## [Version 1.2.0] (09.12.2018)
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

## [Version 1.1.0] (05.12.2018)
### Fixed
- Fixed application for multiple bridges configurations.

## [Version 1.0.4] (05.12.2018)
### Changed
- Merged status and config menu items as 3rd level pages under "Services"
  main menu item.

### Fixed
- Fixed typography in Russian translation.

## [Version 1.0.3] (02.12.2018)
### Fixed
- Fixed bridges select width on config page. This widget produced
  an incorrect UCI config then saved.

## [Version 1.0.2] (23.11.2018)
### Removed
- Removed service status display on status and config pages.

## [Version 1.0.1] (31.10.2018)
### Added
- Added support for LuCI from OpenWrt 18.06.x branch.
- Added screenshots to README.md.

### Fixed
- Minor bugfixes.
- Fixed invalid HTML markup in footer.

## [Version 1.0.0] (04.07.2018)

Initial release

[Unreleased]: https://github.com/tano-systems/luci-app-mstpd/tree/master
[Version 1.2.0]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.2.0
[Version 1.1.0]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.1.0
[Version 1.0.4]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.0.4
[Version 1.0.3]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.0.3
[Version 1.0.2]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.0.2
[Version 1.0.1]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.0.1
[Version 1.0.0]: https://github.com/tano-systems/luci-app-mstpd/releases/tag/v1.0.0
