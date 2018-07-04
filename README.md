# LuCI support for MSTP daemon

## Description
This package allows you to control and monitor MSTPd in LuCI web interface.


## Dependencies
This MSTPd LuCI application depends on mstpd sources from
git://github/tano-systems/mstpd.git (branch json-output-format-support) repository
and init scripts from git://github/tano-systems/meta-tano-openwrt.


## Supported languages
- English
- Russian


## Limitations

Supported only STP and RSTP protocols.
Configuration and status for the MSTP protocol is not supported.


## Screenshots

### Status page
![Status page](screenshots/luci-app-mstpd-status.png?raw=true "Status page")

### Configuration page (bridge)
![Configuration page (bridge)](screenshots/luci-app-mstpd-config-bridge.png?raw=true "Configuration page (bridge)")

### Configuration page (port)
![Configuration page (port)](screenshots/luci-app-mstpd-config-port.png?raw=true "Configuration page (port)")

