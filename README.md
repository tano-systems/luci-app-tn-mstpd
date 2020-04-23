# LuCI support for MSTP daemon

## Description
This package allows you to control and monitor MSTPd in LuCI web interface.

This application can be useful for systems with DSA (Distributed Switch Architecture) enabled switches or for systems with multiple network interfaces.

## Dependencies

Master branch of this repository requires latest LuCI revision with client side rendering feature. Support for older LuCI releases (e.g. for version 18.06.x) is left in the [v1.x](https://github.com/tano-systems/luci-app-tn-mstpd/tree/v1.x) branch of this repository.

This MSTPd LuCI application required latest MSTPd version with JSON output support. MSTPd recipe and required procd init scripts for OpenWrt can be founded in [meta-tanowrt](https://github.com/tano-systems/meta-tanowrt.git) OpenEmbedded layer.

## Supported Languages
- English
- Russian

## Supported (tested) LuCI Themes
- [luci-theme-tano](https://github.com/tano-systems/luci-theme-tano) ([screenshots](#screenshots) are taken with this theme)
- luci-theme-bootstrap
- luci-theme-openwrt-2020
- luci-theme-openwrt

## Limitations
Supported configuration and status only for the STP and RSTP protocols. MSTP protocol is not supported.

## Screenshots

### Bridge Status
![Status page](screenshots/luci-app-mstpd-status.png?raw=true)  
![Status page](screenshots/luci-app-mstpd-status-additional.png?raw=true)

### Global Settings
![Configuration page (global)](screenshots/luci-app-mstpd-config.png?raw=true")

### Bridge Configuration
![Configuration page (bridge)](screenshots/luci-app-mstpd-config-bridge.png?raw=true")

### Port Configuration
![Configuration page (port)](screenshots/luci-app-mstpd-config-port.png?raw=true")  
![Configuration page (port)](screenshots/luci-app-mstpd-config-port-adv.png?raw=true")

