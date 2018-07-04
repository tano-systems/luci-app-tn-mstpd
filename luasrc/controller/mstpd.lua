--
-- Copyright (c) 2018, Tano Systems. All Rights Reserved.
-- Anton Kikin <a.kikin@tano-systems.com>
--

module("luci.controller.mstpd", package.seeall)

function index()
	entry({"admin", "services", "mstpd"}, cbi("mstpd/config"), _("MSTPd"), 80)

	entry({"admin", "status", "mstpd" }, template("mstpd/status"), _("MSTPd"), 80)
	entry({"admin", "status", "mstpd", "status_request"}, call("action_status_request")).leaf = true
end

-- Status page

local json = require "luci.jsonc"

function action_status_request()
	luci.http.prepare_content("application/json")

	bridges = json.parse(luci.util.exec(
		"/sbin/mstpctl --format=json showbridge") or "")

	for i, br in ipairs(bridges) do
		br.ports = json.parse(luci.util.exec(
			"/sbin/mstpctl --format=json showportdetail " .. br.bridge) or "")
	end

	luci.http.write(json.stringify(bridges))
end

