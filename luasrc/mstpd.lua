--
-- Copyright (c) 2018-2020, Tano Systems. All Rights Reserved.
-- Anton Kikin <a.kikin@tano-systems.com>
--

module("luci.mstpd", package.seeall)

local app_version = "1.3.1"
local app_home = "https://github.com/tano-systems/luci-app-tn-mstpd"

function version()
	return app_version
end

function home()
	return app_home
end

function netif_is_stp_bridge(ifname)
	local ntm = require("luci.model.network").init()

	local _, netif
	for _, netif in ipairs(ntm:get_interfaces()) do
		if netif:is_bridge() and netif:bridge_stp() and netif:name() == ifname then
			return true
		end
	end

	return false
end
