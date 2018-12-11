module("luci.mstpd", package.seeall)

local app_version = "1.2.0"

function version()
	return app_version
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
