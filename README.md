# LuCI support for MSTP daemon

## Description
This package allows you to control and monitor MSTPd in LuCI web interface.


## Dependencies
This MSTPd LuCI application depends on mstpd sources from
https://github.com/tano-systems/mstpd.git (branch json-output-format-support) repository
and init scripts from https://github.com/tano-systems/meta-tano-openwrt.git.


## Supported languages
- English
- Russian


## Limitations

Supported configuration and status only for the STP and RSTP protocols.
MSTP protocol currently is not supported.


## Screenshots

### Status page
![Status page](screenshots/luci-app-mstpd-status.png?raw=true "Status page")

### Configuration page (bridge)
![Configuration page (bridge)](screenshots/luci-app-mstpd-config-bridge.png?raw=true "Configuration page (bridge)")

### Configuration page (port)
![Configuration page (port)](screenshots/luci-app-mstpd-config-port.png?raw=true "Configuration page (port)")

