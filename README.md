# LuCI support for MSTP daemon

## Description
This package allows you to control and monitor MSTPd in LuCI web interface.

This application can be useful for systems with DSA (Distributed Switch Architecture)
enabled switches or for systems with multiple network interfaces.

## Dependencies
MSTPd LuCI application developed for LuCI 18.06 branch and
additionally requires fixes from pull-request openwrt/luci#1951.

This MSTPd LuCI application required latest MSTPd version with
JSON output support. MSTPd recipe and init scripts for OpenWrt can be founded
in [meta-tanowrt](https://github.com/tano-systems/meta-tanowrt.git) OpenEmbedded layer.

## Supported languages
- English
- Russian

## Limitations

Supported configuration and status only for the STP and RSTP protocols.
MSTP protocol is not supported.

## Screenshots

### Bridge status
![Status page](screenshots/luci-app-mstpd-status.png?raw=true "Status page")

### Bridge ports status full table
![Status page](screenshots/luci-app-mstpd-status-additional.png?raw=true "Expanded bridge ports status table")

### Bridge configuration
![Configuration page (bridge)](screenshots/luci-app-mstpd-config-bridge.png?raw=true "Configuration page (bridge)")

### Bridge port configuration
![Configuration page (port)](screenshots/luci-app-mstpd-config-port.png?raw=true "Configuration page (port)")

