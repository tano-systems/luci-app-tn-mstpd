#
# Copyright (c) 2018, Tano Systems. All Rights Reserved.
# Anton Kikin <a.kikin@tano-systems.com>
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for MSTP daemon
LUCI_DEPENDS:=+mstpd

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
