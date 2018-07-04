--
-- Copyright (c) 2018, Tano Systems. All Rights Reserved.
-- Anton Kikin <a.kikin@tano-systems.com>
--

local util = require "luci.util"

m = Map("mstpd",
	translate("MSTPd: Configure"),
	translate(
		"<p>MSTPd is a Multiple Spanning Tree Protocol Daemon</p>"
	)
)

-- reload configuration after CBI configuration is commited
m.on_after_commit = function() luci.sys.call("/sbin/bridge-stp restart_config") end

s = m:section(TypedSection, "mstpd", translate("General settings"))

s.anonymous = true
s.addremove = false

--
-- General settings
--

-- Enabled description
mstpd_enabled = s:option(Flag, "enabled",
	translate("Enable MSTPd"))

-- Logging level
mstpd_loglevel = s:option(ListValue, "loglevel",
	translate("MSTPd logging level"))

mstpd_loglevel:value(0, translate("Disable (0)"))
mstpd_loglevel:value(1, translate("Error (1)"))
mstpd_loglevel:value(2, translate("Info (2)"))
mstpd_loglevel:value(3, translate("Debug (3)"))
mstpd_loglevel:value(4, translate("State machine transition (4)"))

--
-- Bridges
--
local ntm = require "luci.model.network".init()

local bridges = { }

for _, netif in ipairs(ntm:get_interfaces()) do
	if netif:is_bridge() and netif:bridge_stp() then
		local ports = { }

		for i, netport in ipairs(netif:ports()) do
			if netport:is_bridgeport() and netport:bridge_stp() then
				ports[#ports + 1] = {
					["name"] = netport:name()
				}
			end
		end

		bridges[#bridges + 1] = {
			["name"]     = netif:name(),
			["name-cfg"] = string.sub(netif:name(), 4), -- remove 'br-' prefix
			["ports"]    = ports
		}
	end
end

if #bridges == 0 then
	s = m:section(SimpleSection, translate("Bridges"))
	s.template = "mstpd/no_bridges"
end

local function get_br_porttab(port_name)
	return "port-" .. port_name
end

local function get_br_portparam(port_name, param_name)
	return "port_" .. port_name .. "_" .. param_name
end

for i, br in ipairs(bridges) do

	s = m:section(NamedSection, br["name-cfg"], "bridge",
		string.format(translate("Bridge (%s)"), br["name"]))

	s.anonymous = false
	s.addremove = false

	s:tab("bridge", string.format(translate("Bridge (%s)"), br["name"]))

	for j, port in ipairs(br["ports"]) do
		s:tab(get_br_porttab(port["name"]),
			string.format(translate("Port %d (%s)"), j, port["name"]))
	end

	--
	dummy = s:taboption("bridge", Value, "name",
		translate("Bridge"),
		translate("Name of the bridge network interface"))

	dummy.value = br["name"]
	dummy.readonly = 1

	--
	br_forcevers = s:taboption("bridge", ListValue, "forcevers",
		translate("Protocol"))

	br_forcevers:value("stp", "STP")
	br_forcevers:value("rstp", "RSTP")
	br_forcevers.default = "rstp"
	br_forcevers.rmempty = false

	--
	br_treeprio = s:taboption("bridge", ListValue, "treeprio",
		translate("Priority"),
		"(0&ndash;15)")

	br_treeprio:value("0",  "0 (0)")
	br_treeprio:value("1",  "4096 (1)")
	br_treeprio:value("2",  "8192 (2)")
	br_treeprio:value("3",  "12288 (3)")
	br_treeprio:value("4",  "16384 (4)")
	br_treeprio:value("5",  "20480 (5)")
	br_treeprio:value("6",  "24576 (6)")
	br_treeprio:value("7",  "28672 (7)")
	br_treeprio:value("8",  "32768 (8)")
	br_treeprio:value("9",  "36864 (9)")
	br_treeprio:value("10", "40960 (10)")
	br_treeprio:value("11", "45056 (11)")
	br_treeprio:value("12", "49152 (12)")
	br_treeprio:value("13", "53248 (13)")
	br_treeprio:value("14", "57344 (14)")
	br_treeprio:value("15", "61440 (15)")

	br_treeprio.default = "8"
	br_treeprio.rmempty = false

	--
	br_hello = s:taboption("bridge", Value, "hello",
		translate("Hello time"),
		translate("(1&ndash;10 seconds)"))

	br_hello.default = "2"
	br_hello.rmempty = false

	function br_hello.validate(self, value, section)
		if value >= 1 and value <= 10 then
			return value
		end

		return nil, translate("Bridge hello time must be in range from 1 to 10")
	end

	--
	br_fdelay = s:taboption("bridge", Value, "fdelay",
		translate("Forward delay time"),
		translate("(4&ndash;30 seconds)"))

	br_fdelay.default = "15"
	br_fdelay.rmempty = false

	function br_fdelay.validate(self, value, section)
		if value >= 4 and value <= 30 then
			return value
		end

		-- TODO: check condition [ 2 * (Forward Delay - 1) >= Max Age ]

		return nil, translate("Bridge forward delay time must be in range from 4 to 30")
	end

	--
	br_maxage = s:taboption("bridge", Value, "maxage",
		translate("Max age"),
		translate("(6&ndash;40 seconds)"))

	br_maxage.default = "20"
	br_maxage.rmempty = false

	function br_maxage.validate(self, value, section)
		if value >= 6 and value <= 40 then
			return value
		end

		-- TODO: check condition [ 2 * (Forward Delay - 1) >= Max Age ]

		return nil, translate("Bridge max age must be in range from 6 to 40")
	end

	--
	br_maxhops = s:taboption("bridge", Value, "maxhops",
		translate("Max hops"),
		"(6&ndash;40)")

	br_maxhops.default = "20"
	br_maxhops.rmempty = false

	function br_maxhops.validate(self, value, section)
		if value >= 6 and value <= 40 then
			return value
		end

		return nil, translate("Bridge max hops must be in range from 6 to 40")
	end

	--
	br_txholdcount = s:taboption("bridge", Value, "txholdcount",
		translate("Transmit hold count"),
		"(1&ndash;10)")

	br_txholdcount.default = "6"
	br_txholdcount.rmempty = false

	function br_txholdcount.validate(self, value, section)
		if value >= 1 and value <= 10 then
			return value
		end

		return nil, translate("Bridge transmit hold count must be in range from 1 to 10")
	end

	--
	-- Ports
	--
	for j, port in ipairs(br["ports"]) do

		dummy = s:taboption(get_br_porttab(port["name"]), Value,
			get_br_portparam(port["name"], "name"),
			translate("Port"),
			translate("Name of the bridge port network interface"))

		dummy.value = port["name"]
		dummy.readonly = 1

		-- Port priority
		port_treeportprio = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "treeprio"),
			translate("Priority"),
			"(0&ndash;15)")

		port_treeportprio:value("0",  "0 (0)")
		port_treeportprio:value("1",  "4096 (1)")
		port_treeportprio:value("2",  "8192 (2)")
		port_treeportprio:value("3",  "12288 (3)")
		port_treeportprio:value("4",  "16384 (4)")
		port_treeportprio:value("5",  "20480 (5)")
		port_treeportprio:value("6",  "24576 (6)")
		port_treeportprio:value("7",  "28672 (7)")
		port_treeportprio:value("8",  "32768 (8)")
		port_treeportprio:value("9",  "36864 (9)")
		port_treeportprio:value("10", "40960 (10)")
		port_treeportprio:value("11", "45056 (11)")
		port_treeportprio:value("12", "49152 (12)")
		port_treeportprio:value("13", "53248 (13)")
		port_treeportprio:value("14", "57344 (14)")
		port_treeportprio:value("15", "61440 (15)")

		port_treeportprio.default = "8"
		port_treeportprio.rmempty = false

		-- External path cost
		port_pathcost = s:taboption(
			get_br_porttab(port["name"]), Value,
			get_br_portparam(port["name"], "pathcost"),
			translate("External path cost"),
			translate("(0 &mdash; auto)"))

		port_pathcost.default = "0"
		port_pathcost.rmempty = false

		-- Internal path cost
		port_treeportcost = s:taboption(
			get_br_porttab(port["name"]), Value,
			get_br_portparam(port["name"], "treecost"),
			translate("Internal path cost"),
			translate("(0 &mdash; auto)"))

		port_treeportcost.default = "0"
		port_treeportcost.rmempty = false

		-- Admin edge
		port_adminedge = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "adminedge"),
			translate("Admin edge"),
			translate("Initial edge state"))

		port_adminedge:value("no", translate("No"))
		port_adminedge:value("yes", translate("Yes"))

		port_adminedge.default = "no"
		port_adminedge.rmempty = false

		-- Auto edge
		port_autoedge = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "autoedge"),
			translate("Auto transition to/from edge state"))

		port_autoedge:value("no", translate("No"))
		port_autoedge:value("yes", translate("Yes"))

		port_autoedge.default = "yes"
		port_autoedge.rmempty = false

		-- P2P
		port_p2p = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "p2p"),
			translate("Point-to-point detection mode"))

		port_p2p:value("no", translate("No"))
		port_p2p:value("yes", translate("Yes"))
		port_p2p:value("auto", translate("Auto"))

		port_p2p.default = "auto"
		port_p2p.rmempty = false

		-- BPDU guard
		port_bpduguard = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "bpduguard"),
			translate("BPDU guard"))

		port_bpduguard:value("no", translate("No"))
		port_bpduguard:value("yes", translate("Yes"))

		port_bpduguard.default = "no"
		port_bpduguard.rmempty = false

		-- Restrict root role
		port_restrrole = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "restrrole"),
			translate("Restrict port ability to take Root role"))

		port_restrrole:value("no", translate("No"))
		port_restrrole:value("yes", translate("Yes"))

		port_restrrole.default = "no"
		port_restrrole.rmempty = false

		-- Restrict TCN receive
		port_restrtcn = s:taboption(
			get_br_porttab(port["name"]), ListValue,
			get_br_portparam(port["name"], "restrtcn"),
			translate("Restrict port ability to propagate received TCN's"))

		port_restrtcn:value("no", translate("No"))
		port_restrtcn:value("yes", translate("Yes"))

		port_restrtcn.default = "no"
		port_restrtcn.rmempty = false
	end
end

--
-- Footer
--

f = m:section(SimpleSection, nil)
f.template = "mstpd/footer"

return m
