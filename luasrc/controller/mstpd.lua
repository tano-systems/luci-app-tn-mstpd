--
-- Copyright (c) 2018, Tano Systems. All Rights Reserved.
-- Anton Kikin <a.kikin@tano-systems.com>
--

module("luci.controller.mstpd", package.seeall)

require("luci.sys")

function index()
	if not nixio.fs.access("/etc/config/mstpd") then
		return
	end

	entry({"admin", "services", "mstpd"}, firstchild(), _("MSTPd"), 80)
	entry({"admin", "services", "mstpd", "status" }, template("mstpd/status"), _("Status"), 10)
	entry({"admin", "services", "mstpd", "config" }, cbi("mstpd/config"), _("Settings"), 20)
	entry({"admin", "services", "mstpd", "status_request"}, call("action_status_request")).leaf = true
	entry({"admin", "services", "mstpd", "status_get"}, call("action_status_get")).leaf = true
end

-- Status page

local json = require "luci.jsonc"

function action_status_get()
	local sys = require "luci.sys"

	local status = {
		running = false,
		pid     = 0
	}

	status.running = (sys.call("pidof mstpd >/dev/null") == 0)

	if status.running then
		status.pid = luci.util.exec("pidof mstpd")
		if status.pid == "" then
			status.pid = 0
		else
			status.pid = tonumber(status.pid)
		end
		if not status.pid then
			status.running = false
		end
	end

	luci.http.prepare_content("application/json")
	luci.http.write_json(status)
end

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

