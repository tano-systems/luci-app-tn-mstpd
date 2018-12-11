--
-- Copyright (c) 2018, Tano Systems. All Rights Reserved.
-- Anton Kikin <a.kikin@tano-systems.com>
--

module("luci.controller.mstpd", package.seeall)


function index()
	if not nixio.fs.access("/etc/config/mstpd") then
		return
	end

	local i18n  = require("luci.i18n")
	local uci   = require("luci.model.uci").cursor()
	local mstpd = require("luci.mstpd")
	local ntm   = require("luci.model.network").init()

	local uci_bridges = uci:get("mstpd", "global", "bridge")
	local has_bridges = false

	entry({"admin", "services", "mstpd"}, firstchild(), _("MSTPd"), 80)

	status_entry = entry({"admin", "services", "mstpd", "status" },
		firstchild(), _("Status"), 10
	)

	if uci_bridges and #uci_bridges > 0 then
		local i, br

		for i, br in ipairs(uci_bridges) do
			if mstpd.netif_is_stp_bridge(br) then
				entry({"admin", "services", "mstpd", "status", br },
					call("action_status_render"),
					i18n.translatef('Bridge "%s"', br), i
				)

				has_bridges = true
			end
		end
	end

	if not has_bridges then
		-- Output status page for no bridges state
		status_entry.target = template("mstpd/no-bridges")
	end

	entry({"admin", "services", "mstpd", "config" },
		cbi("mstpd/config"), _("Settings"), 20)

	entry({"admin", "services", "mstpd", "status_request"},
		call("action_status_request"))

	entry({"admin", "services", "mstpd", "status_get"},
		call("action_status_get"))
end

-- Status page

function action_status_render()
	local vars = luci.http.formvalue()
	local req  = luci.dispatcher.context.request
	local path = luci.dispatcher.context.path

	local bridge = ""

	-- find requested bridge
	for i, p in ipairs(luci.dispatcher.context.path) do
		if luci.dispatcher.context.path[i] == "status" then
			bridge = luci.dispatcher.context.path[i + 1]
			break
		end
	end

	luci.template.render("mstpd/status", {
		bridge = bridge
	})
end

function action_status_request()
	local json = require("luci.jsonc")
	local http = require("luci.http")
	local uci  = require("luci.model.uci").cursor()

	local uci_bridges = uci:get("mstpd", "global", "bridge")

	local bridges
	local bridge = http.formvalue("bridge")

	if bridge then
		-- Get information about specified bridge
		local br

		bridges = json.parse(luci.util.exec(
			"/sbin/mstpctl --format=json showbridge " .. bridge) or {})

		if #bridges > 0 then
			bridges[1].ports = json.parse(luci.util.exec(
				"/sbin/mstpctl --format=json showportdetail " .. bridge) or {})
		end
	else
		-- Get information about all bridges
		if uci_bridges and #uci_bridges > 0 then
			local i, br
			local bridges_list = table.concat(uci_bridges, " ")

			bridges = json.parse(luci.util.exec(
				"/sbin/mstpctl --format=json showbridge %s" % bridges_list) or {})

			for i, br in ipairs(bridges) do
				br.ports = json.parse(luci.util.exec(
					"/sbin/mstpctl --format=json showportdetail " .. br.bridge) or {})
			end
		end
	end

	luci.http.prepare_content("application/json")
	luci.http.write(json.stringify(bridges))
end

