/*
 * Copyright (c) 2020 Tano Systems. All Rights Reserved.
 * Author: Anton Kikin <a.kikin@tano-systems.com>
 */

'use strict';
'require rpc';
'require form';
'require mstpd';
'require network';
'require uci';

return L.view.extend({
	load: function() {
		return Promise.all([
			network.getDevices(),
			mstpd.init(),
			uci.load('mstpd')
		]);
	},

	populateBridgeParameters: function(m, s, br) {
		var o;

		o = s.option(form.DummyValue, '_iface', _('Interface'));
		o.write = function() {};
		o.remove = function() {};
		o.renderWidget = function(section_id, option_id, cfgvalue) {
			return E('span', {}, [
				E('strong', {}, br['name']), ' ',
				N_(br['ports'].length, '(%d port)', '(%d ports)').format(br['ports'].length)
			]);
		};

		// Bridge forced protocol
		o = s.option(form.ListValue, 'forcevers',
			_('Protocol'),
			'<ul>' +
				'<li>STP — ' + _('Each port of the bridge sends out STP BPDU\'s') + ';</li>' +
				'<li>RSTP — ' +
					_('Each port of the bridge sends out RSTP BPDU\'s, ' +
					  'and automatically migrates to STP-compatible mode when ' +
					  'detecting that it is connected with a bridge running STP') +
				'.</li>' +
			'</ul>'
		);
		o.value('stp', 'STP');
		o.value('rstp', 'RSTP');
		o.default = 'rstp';
		o.rmempty = true;

		// Bridge priority
		o = s.option(form.ListValue, 'treeprio',
			_('Priority'),
			_('Bridge priority (0–61440). Default bridge priority is 32768.'));

		o.value('0',  '0');
		o.value('1',  '4096');
		o.value('2',  '8192');
		o.value('3',  '12288');
		o.value('4',  '16384');
		o.value('5',  '20480');
		o.value('6',  '24576');
		o.value('7',  '28672');
		o.value('8',  '32768');
		o.value('9',  '36864');
		o.value('10', '40960');
		o.value('11', '45056');
		o.value('12', '49152');
		o.value('13', '53248');
		o.value('14', '57344');
		o.value('15', '61440');

		o.default = '8';
		o.rmempty = true;

		// Hello time
		o = s.option(form.Value, 'hello',
			_('Hello time'),
			_('Interval at which the bridge sends hello packets to the ' +
			  'surrounding bridges to make sure the paths are fault-free (1–10 seconds).'));

		o.default = '2';
		o.rmempty = true;

		o.validate = function(section_id, value) {
			if (value != parseInt(value))
				return _('Must be a number');
			else if (value < 1 || value > 10)
				return _('Must be in range from 1 to 10');
			return true;
		};

		// Formward delay time and max age
		var default_maxage = 20;

		var fdelayOpt;
		var maxageOpt;

		fdelayOpt = s.option(form.Value, 'fdelay',
			_('Forward delay time'),
			_('Delay for the root and designated ports to transit to ' +
			  'the forwarding state (4–30 seconds).'));

		fdelayOpt.default = 15;
		fdelayOpt.rmempty = true;
		fdelayOpt.validate = function(section_id, value) {
			if (value != parseInt(value))
				return _('Must be a number');
			else if (value < 4 || value > 30)
				return _('Must be in range from 4 to 30');

			var fdelay = value;
			var maxage = parseInt(maxageOpt.formvalue(section_id));

			if (!maxage)
				maxage = default_maxage;

			var compare = 2 * (fdelay - 1);

			// Check condition [ 2 * (Forward Delay - 1) >= Max Age ]
			if (maxage > compare)
				return _('Must meet the condition [ 2 * (Forward Delay - 1) >= Max Age ]');

			return true;
		};

		maxageOpt = s.option(form.Value, 'maxage',
			_('Max age'),
			_('Maximum length of time a configuration BPDU can be held by the bridge (6–40 seconds).'));

		maxageOpt.default = default_maxage;
		maxageOpt.rmempty = true;
		maxageOpt.validate = function(section_id, value) {
			if (value != parseInt(value))
				return _('Must be a number');
			else if (value < 6 || value > 40)
				return _('Must be in range from 6 to 40');

			var maxage  = value;
			var fdelay  = parseInt(fdelayOpt.formvalue(section_id));
			var compare = 2 * (fdelay - 1);

			// Check condition [ 2 * (Forward Delay - 1) >= Max Age ]
			if (maxage > compare)
				return _('Must meet the condition [ 2 * (Forward Delay - 1) >= Max Age ]');

			return true;
		};

		// Ageing
		o = s.option(form.Value, 'ageing',
			_('Ageing'),
			_('Bridge ethernet (MAC) address ageing time (10–1000000 seconds). ' +
			  'After specified time of not having seen a frame coming from a certain ' +
			  'address, the bridge will time out (delete) that address from the ' +
			  'Forwarding DataBase (FDB)'));

		o.default = '300';
		o.rmempty = true;

		o.validate = function(section_id, value) {
			if (value != parseInt(value))
				return _('Must be a number');
			else if (value < 10 || value > 1000000)
				return _('Must be in range from 10 to 1000000');
			return true;
		};

		// Transmit hold count
		o = s.option(form.Value, 'txholdcount',
			_('Transmit hold count'), '(1–10)');

		o.default = '6';
		o.rmempty = true;

		o.validate = function(section_id, value) {
			if (value != parseInt(value))
				return _('Must be a number');
			else if (value < 1 || value > 10)
				return _('Must be in range from 1 to 10');
			return true;
		};
	},

	populateBridgePorts: function(m, s, br) {
		var o;

		s.tab('general', _('General Settings'));
		s.tab('advanced', _('Advanced Settings'));

		// Interface name
		o = s.taboption('general', form.DummyValue, '_iface', _('Interface'));
		o.write = function() {};
		o.remove = function() {};
		o.modalonly = false; /* only in table */
		o.editable = true;
		o.width = '100px';
		o.renderWidget = function(section_id, option_id, cfgvalue) {
			return E('strong', {}, section_id);
		};

		// Port priority
		o = s.taboption('general', form.ListValue, 'treeprio',
			_('Priority'),
			_('Port priority (0–61440). Default port priority is 32768.'));

		o.value('0',  '0');
		o.value('1',  '4096');
		o.value('2',  '8192');
		o.value('3',  '12288');
		o.value('4',  '16384');
		o.value('5',  '20480');
		o.value('6',  '24576');
		o.value('7',  '28672');
		o.value('8',  '32768');
		o.value('9',  '36864');
		o.value('10', '40960');
		o.value('11', '45056');
		o.value('12', '49152');
		o.value('13', '53248');
		o.value('14', '57344');
		o.value('15', '61440');

		o.width = '130px';
		o.modalonly = null;
		o.editable = true;
		o.default = '8';
		o.rmempty = true;

		// External path cost
		o = s.taboption('general', form.Value, 'pathcost',
			_('Path cost'),
			_('(0 — auto)'));

		o.modalonly = null;
		o.editable = true;
		o.default = '0';
		o.rmempty = true;
		o.width = '100px';

		// Admin edge
		o = s.taboption('general', form.Flag, 'adminedge',
			_('Admin edge'),
			_('Initial edge state'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = null;
		o.editable = true;
		o.default = 'no';
		o.optional = false;
		o.rmempty = false;
		o.width = '130px';

		// Auto edge
		o = s.taboption('general', form.Flag, 'autoedge',
			_('Auto edge'), _('Auto transition to/from edge state'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = null;
		o.editable = true;
		o.default = 'yes';
		o.optional = false;
		o.rmempty = false;
		o.width = '130px';

		// P2P
		o = s.taboption('general', form.ListValue, 'p2p',
			_('P2P mode'), _('Point-to-Point detection mode'));

		o.value('no', _('No'));
		o.value('yes', _('Yes'));
		o.value('auto', _('Auto'));

		o.modalonly = true;
		o.editable = true;
		o.default = 'auto';
		o.rmempty = true;

		// BPDU filter
		o = s.taboption('advanced', form.Flag, 'bpdufilter',
			_('BPDU filter'), _('Disable STP/RSTP processing on this port'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = null;
		o.editable = true;
		o.default = 'no';
		o.optional = false;
		o.rmempty = false;
		o.width = '60px';

		// BPDU guard
		o = s.taboption('advanced', form.Flag, 'bpduguard',
			_('BPDU guard'),
			_('Disable port if BPDU is detected (received) on it.'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = null;
		o.editable = true;
		o.default = 'no';
		o.optional = false;
		o.rmempty = false;
		o.width = '60px';

		// Restrict root role
		o = s.taboption('advanced', form.Flag, 'restrrole',
			_('Restrict port ability to take root role'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = true;
		o.editable = true;
		o.default = 'no';
		o.optional = false;
		o.rmempty = false;

		// Restrict TCN receive
		o = s.taboption('advanced', form.Flag, 'restrtcn',
			_('Restrict port ability to propagate received TCN\'s'));

		o.enabled = 'yes';
		o.disabled = 'no';
		o.modalonly = true;
		o.editable = true;
		o.default = 'no';
		o.optional = false;
		o.rmempty = false;
	},

	render: function(data) {
		var m, s, o;
		var netDevices = data[0];

		m = new form.Map('mstpd', _('STP/RSTP Settings'),
			_('On this page you may configure STP/RSTP settings'));

		m.tabbed = true;

		s = m.section(form.TypedSection, 'mstpd', _('Global settings'));
		s.addremove = false;
		s.anonymous = true;

		// -----------------------------------------------------------------------------------------
		//
		// Daemon settings
		//
		// -----------------------------------------------------------------------------------------

		// Logging level
		o = s.option(form.ListValue, 'loglevel', _('Logging level'));

		o.default = '2';
		o.value('0', _('Disable (0)'));
		o.value('1', _('Error (1)'));
		o.value('2', _('Info (2)'));
		o.value('3', _('Debug (3)'));
		o.value('4', _('State machine transition (4)'));

		o = s.option(mstpd.BridgesSelect, 'bridge',
			_('Bridges controlled by STP/RSTP service'),
			_('You can not select bridges with disabled STP support. ' +
			  'You may enable or disable STP support for bridges on the ' +
			  '<a href=\"%s\">network interfaces settings</a>')
				.format(L.url('admin/network/network')));

		o.onlystp = true;
		o.multiple = true;
		o.optional = false;
		o.display_size = 6;
		o.write = function(section_id, value) {
			/* Add newly added bridges to configuration */
			for (var i = 0; i < value.length; i++) {
				uci.add('mstpd', 'bridge', value[i].replace(/^(br-)/, ''));
			}

			return form.Value.prototype.write.apply(this, [section_id, value]);
		};

		// -----------------------------------------------------------------------------------------
		//
		// Bridges
		//
		// -----------------------------------------------------------------------------------------
		var bridges = [];
		var bridgesEnabled = m.data.get('mstpd', 'global', 'bridge');

		var isOldLuCI = false;

		netDevices.forEach(function(netdev) {
			if (!bridgesEnabled)
				return;

			if (!isOldLuCI)
				isOldLuCI = netdev.hasOwnProperty('ifname');

			if (bridgesEnabled.indexOf(isOldLuCI ? netdev.ifname : netdev.device) === -1)
				return;

			if (!netdev.isBridge())
				return;

			if (!netdev.getBridgeSTP())
				return;

			var dev = isOldLuCI ? netdev.ifname : netdev.device;
			bridges.push({
				'name': dev,
				'name-cfg': dev.replace(/^(br-)/, ''),
				'ports': netdev.getPorts(),
			});
		});

		if (bridges.length == 0) {
			o = s.option(form.DummyValue, '__info');
			o.write = function() {};
			o.remove = function() {};
			o.render = function() {
				return E('div', { 'class': 'alert-message warning' }, [
					_('You must select at least one bridge for ' +
					  'controlling by the STP/RSTP service')
				]);
			};

			return m.render();
		}

		bridges.sort(function(a, b) {
			return a['name-cfg'].localeCompare(b['name-cfg']);
		});

		//
		// Add UCI sections for not existing items in config
		//
		for (let i = 0; i < bridges.length; i++) {
			if (!m.data.get('mstpd', bridges[i]['name-cfg']))
				m.data.add('mstpd', 'bridge', bridges[i]['name-cfg']);

			for (let j = 0; j < bridges[i].ports.length; j++) {
				var dev = isOldLuCI ? bridges[i].ports[j].ifname
				                    : bridges[i].ports[j].device;
				if (!m.data.get('mstpd', dev))
					var sid = m.data.add('mstpd', 'bridge_port', dev);
			}
		}

		//
		// Create sections for bridges
		//
		for (var i = 0; i < bridges.length; i++) {
			var br = bridges[i];

			s = m.section(form.NamedSection,
				br['name-cfg'], // sid
				'bridge_' + br['name-cfg'], // type
				_('Bridge "%s"').format(br['name'])
			);

			s.anonymous = false;
			s.addremove = false;

			this.populateBridgeParameters(m, s, br);

			// Bridge ports configuration table
			o = s.option(form.SectionValue, '_ports_' + br['name-cfg'], form.GridSection, 'bridge_port',
				_('Bridge "%s" ports').format(br['name']),
				_('You can include and exclude ports from the bridge on the ' +
				  '<a href=\"%s\">network interfaces configuration</a> page.')
					.format(L.url('admin/network/network')));

			var ss = o.subsection;
			ss.nodescriptions = true;
			ss.anonymous = true;
			ss.addremove = false;
			ss.sortable = true;

			ss.filter = L.bind(function(br, section_id) {
				for (let p = 0; p < br.ports.length; p++) {
					var dev = isOldLuCI ? br.ports[p].ifname
					                    : br.ports[p].device;

					if (dev == section_id)
						return true;
				}

				return false;
			}, ss, br);

			ss.modaltitle = L.bind(function(br, section_id) {
				return _('Port "%s" of bridge "%s" parameters').format(
					section_id, br['name']);
			}, ss, br);

			this.populateBridgePorts(m, ss, br);
		}

		return m.render();
	},

	addFooter: function() {
		return [
			this.super('addFooter', arguments),
			mstpd.renderFooter()
		];
	},
});
