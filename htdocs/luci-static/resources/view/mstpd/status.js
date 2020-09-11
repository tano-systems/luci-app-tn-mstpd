/*
 * Copyright (c) 2020 Tano Systems. All Rights Reserved.
 * Author: Anton Kikin <a.kikin@tano-systems.com>
 */

'use strict';
'require rpc';
'require form';
'require mstpd';
'require dom';
'require poll';

var callMSTPStatus = rpc.declare({
	object: 'mstpd',
	method: 'getStatus',
	expect: {}
});

const mstpdBridgeParams = {
	'force-protocol-version'     : _('Administrative protocol version'),
	'enabled'                    : _('Enabled', 'Bridge status'),
	'bridge-id'                  : _('Bridge ID'),
	'designated-root'            : _('Designated root'),
	'regional-root'              : _('Regional root'),
	'root-port'                  : _('Root port'),
	'path-cost'                  : _('Path cost'),
	'max-age'                    : _('Max age'),
	'forward-delay'              : _('Forward delay time'),
	'tx-hold-count'              : _('Transmit hold count'),
	'hello-time'                 : _('Hello time'),
	'ageing-time'                : _('Ageing time'),
	'time-since-topology-change' : _('Time since topology change'),
	'last-topology-change-port'  : _('Last topology change port'),
	'topology-change-count'      : _('Topology change count')
};

const mstpdBridgePortParams = {
	'enabled'                    : _('Enabled', 'Port status'),
	'bpdu-filter-port'           : _('STP/RSTP processing'),
	'bpdu-guard-port'            : _('BPDU guard'),
	'bpdu-guard-error'           : _('BPDU guard error'),
	'received-stp'               : _('Operative protocol version'),
	'role'                       : _('Port role'),
	'state'                      : _('Port state'),
	'port-id'                    : _('Port identifier'),
	'external-port-cost'         : _('Port path cost'),
	'designated-root'            : _('Designated root'),
	'designated-bridge'          : _('Designated bridge'),
	'designated-port'            : _('Designated port'),
	'admin-edge-port'            : _('Admin edge'),
	'auto-edge-port'             : _('Auto edge'),
	'oper-edge-port'             : _('Operative edge'),
	'admin-point-to-point'       : _('Admin P2P'),
	'point-to-point'             : _('Operative P2P'),
	'num-tx-bpdu'                : _('Tx BPDU'),
	'num-rx-bpdu'                : _('Rx BPDU'),
	'num-rx-bpdu-filtered'       : _('Rx BPDU (filtered)'),
	'num-tx-tcn'                 : _('Tx TCN'),
	'num-rx-tcn'                 : _('Rx TCN')
};

function vcb_yn(br, v) {
	return (v == 'no')
		? E('span', { 'class': 'mstpd-no'  }, _('No'))
		: E('span', { 'class': 'mstpd-yes' }, '&#x2714; ' + _('Yes'));
}

function vcb_yn_inverted(br, v) {
	return vcb_yn(br, (v == 'yes') ? 'no' : 'yes');
}

function vcb_yna(br, v) {
	return (v == 'auto') ? _('Auto') : vcb_yn(br, v);
}

function vcb_seconds(br, v) {
	return _('%d s').format(v);
}

function vcb_time(br, v) {
	return _('%t (%d s)').format(v, v);
}

function mstpd_br_status_add(br, option, value_cb_func)
{
	if (!mstpdBridgeParams[option] || (typeof br[option] == 'undefined'))
		return '';

	if (!value_cb_func)
		value_cb_func = function(br, v) { return v; }

	return E('div', {}, [
		E('span', { 'class': 'mstpd-br-param' }, mstpdBridgeParams[option]),
		E('span', { 'class': 'mstpd-br-param-value' }, value_cb_func(br, br[option]))
	]);
}

var CBIBridgeStatus = form.DummyValue.extend({
	renderWidget: function(section_id, option_id, cfgvalue) {
		var br = cfgvalue;
		var items = [];

		if (!br || !br.hasOwnProperty('bridge')) {
			return E('div', { 'class': 'alert-message warning' },
				_('No data to display. Perhaps no bridges are configured to be controlled by the STP/RSTP service.')
			);
		}

		items.push(mstpd_br_status_add(br, 'enabled', vcb_yn));

		items.push(mstpd_br_status_add(br, 'force-protocol-version', function(br, v) {
			return v.toUpperCase()
		}));

		items.push(mstpd_br_status_add(br, 'bridge-id'));
		items.push(mstpd_br_status_add(br, 'designated-root'));
		items.push(mstpd_br_status_add(br, 'regional-root'));

		items.push(mstpd_br_status_add(br, 'root-port', function(br, v) {
			return ((v == 'none') || (v == '')) ? _('none', 'Port name') : v
		}));

		items.push(mstpd_br_status_add(br, 'path-cost'));
		items.push(mstpd_br_status_add(br, 'max-age', vcb_seconds));
		items.push(mstpd_br_status_add(br, 'forward-delay', vcb_seconds));
		items.push(mstpd_br_status_add(br, 'tx-hold-count'));
		items.push(mstpd_br_status_add(br, 'hello-time', vcb_seconds));
		items.push(mstpd_br_status_add(br, 'ageing-time', vcb_seconds));
		items.push(mstpd_br_status_add(br, 'time-since-topology-change', vcb_time));

		items.push(mstpd_br_status_add(br, 'last-topology-change-port', function(br, v) {
			return ((v == 'None') || (v == '')) ? _('none', 'Port name') : v
		}));

		items.push(mstpd_br_status_add(br, 'topology-change-count'));

		return E('div', { 'class': 'mstpd-br-params' }, items);
	},
});

function vcb_port_state(br, v) {
	if (v == 'forwarding')
		return E('span', { 'class': 'mstpd-badge mstpd-state-forwarding' }, 'Forwarding');
	else if (v == 'learning')
		return E('span', { 'class': 'mstpd-badge mstpd-state-learning' }, 'Learning');
	else if (v == 'discarding')
		return E('span', { 'class': 'mstpd-badge mstpd-state-discarding' }, 'Discarding');
	else
		return v.charAt(0).toUpperCase() + v.slice(1);
}

function vcb_port_role(br, v) {
	if (v == 'Designated')
		return E('span', { 'class': 'mstpd-badge mstpd-role-designated' }, 'Designated');
	else if (v == "Alternate")
		return E('span', { 'class': 'mstpd-badge mstpd-role-alternate' }, 'Alternate');
	else if (v == "Root")
		return E('span', { 'class': 'mstpd-badge mstpd-role-root' }, 'Root');
	else if (v == "Backup")
		return E('span', { 'class': 'mstpd-badge mstpd-role-backup' }, 'Backup');
	else if (v == "Disabled")
		return E('span', { 'class': 'mstpd-badge mstpd-role-disabled' }, 'Disabled');
	else
		return v;
}

function vcb_num_or_dash(br, v) {
	return parseInt(v) == 0 ? '–' : v;
}

function mstpd_brports_status_add(br, option, value_cb_func, bpdu_filter)
{
	var row = [];

	if (!mstpdBridgePortParams[option])
		return null;

	if (!value_cb_func)
		value_cb_func = function(br, v) { return v };

	row.push(mstpdBridgePortParams[option]);

	br.ports.forEach(function(p) {
		if (bpdu_filter) {
			if (p['bpdu-filter-port'] == 'yes') {
				row.push('–');
				return;
			}
		}

		row.push(value_cb_func(br, p[option]));
	})

	return row;
}

var CBIBridgePortsStatus = form.DummyValue.extend({
	__init__: function() {
		this.super('__init__', arguments);

		this.recentData = null;
		this.table = E('div', { 'class': 'table mstpd-brports-status' }, [
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th top center' }, '...')
			]),
			E('div', { 'class': 'tr placeholder' }, [
				E('div', { 'class': 'td' },
					E('em', { 'class': 'spinning' }, _('Collecting data...'))
				)
			])
		]);
	},

	tableUpdateHeaders: function(br) {
		var p;
		var len = br.ports.length;

		if (!this.recentData || (len != recentData.ports.length))
		{
			var portHeaders = [];
			portHeaders.push(E('div', { 'class': 'th middle left' }, _('Port')));

			for (p = 0; p < len; p++)
			{
				portHeaders.push(
					E('div', {
						'class': 'th middle right',
						'id': 'mstpd-brports-status-header-' + p
					}, br.ports[p].port)
				);
			}

			var header = E('div', { 'class': 'tr table-titles' }, portHeaders);
			dom.content(this.table, header);
		}
		else
		{
			for (p = 0; p < len; p++)
			{
				var header = this.table.querySelector(
					'#mstpd-brports-status-header-' + p)

				dom.content(header, br.ports[p].port);
			}
		}
	},

	tableUpdateData: function(br, shortMode) {
		var rows = [];

		rows.push(mstpd_brports_status_add(br, 'enabled', vcb_yn));
		rows.push(mstpd_brports_status_add(br, 'bpdu-filter-port', vcb_yn_inverted));

		rows.push(mstpd_brports_status_add(br, 'received-stp', function(br, v) {
			if (br['force-protocol-version'] === 'stp') {
				return E('span', { 'class': 'mstpd-badge mstpd-proto-ok' }, 'STP');
			} else {
				if (v === 'yes')
					return E('span', { 'class': 'mstpd-badge mstpd-proto-changed' }, 'STP');
				else
					return E('span', { 'class': 'mstpd-badge mstpd-proto-ok' }, 'RSTP');
			}
		}, true));

		rows.push(mstpd_brports_status_add(br, 'role', vcb_port_role, true));
		rows.push(mstpd_brports_status_add(br, 'state', vcb_port_state, true));
		rows.push(mstpd_brports_status_add(br, 'port-id'));
		rows.push(mstpd_brports_status_add(br, 'designated-root', null, true));
		rows.push(mstpd_brports_status_add(br, 'designated-bridge', null, true));

		rows.push(mstpd_brports_status_add(br, 'designated-port', function(br, v) {
			if (v === '0.000')
				return '–';
			return v;
		}, true));

		if (!shortMode)
		{
			rows.push(mstpd_brports_status_add(br, 'external-port-cost', null, true));
			rows.push(mstpd_brports_status_add(br, 'admin-edge-port', vcb_yn, true));
			rows.push(mstpd_brports_status_add(br, 'auto-edge-port', vcb_yn, true));
			rows.push(mstpd_brports_status_add(br, 'oper-edge-port', vcb_yn, true)) ;
			rows.push(mstpd_brports_status_add(br, 'admin-point-to-point', vcb_yna, true));
			rows.push(mstpd_brports_status_add(br, 'point-to-point', vcb_yn, true));
			rows.push(mstpd_brports_status_add(br, 'bpdu-guard-port', vcb_yn));
			rows.push(mstpd_brports_status_add(br, 'bpdu-guard-error', vcb_yn));
			rows.push(mstpd_brports_status_add(br, 'num-tx-bpdu', vcb_num_or_dash, true));
			rows.push(mstpd_brports_status_add(br, 'num-rx-bpdu', vcb_num_or_dash, true));
			rows.push(mstpd_brports_status_add(br, 'num-rx-bpdu-filtered', vcb_num_or_dash));
			rows.push(mstpd_brports_status_add(br, 'num-tx-tcn', vcb_num_or_dash, true));
			rows.push(mstpd_brports_status_add(br, 'num-rx-tcn', vcb_num_or_dash, true));
		}

		cbi_update_table(this.table, rows,
			_('There is no available information'));
	},

	renderWidget: function(section_id, options_id, cfgvalue) {
		var br = cfgvalue;

		if (!br || !br.hasOwnProperty('bridge')) {
			return E('div', { 'class': 'alert-message warning' },
				_('No data to display. Perhaps no bridges are ' +
				  'configured to be controlled by the STP/RSTP service.'));
		}

		this.shortMode = mstpd.getStatusShortMode(br['bridge']);

		this.tableUpdateHeaders(br);
		this.tableUpdateData(br, this.shortMode);
		this.recentData = br;

		function btnTitle(shortMode) {
			return shortMode
				? ('↓ ' + _('More information') + ' ↓')
				: ('↑ ' + _('Less information') + ' ↑');
		}

		return E('div', {}, [
			E('div', { 'class': 'table-wrapper' }, this.table),
			E('div', { 'class': 'cbi-page-actions control-group' }, [
				E('input', {
					'class': 'cbi-button',
					'type': 'button',
					'value': btnTitle(this.shortMode),
					'click': L.bind(function(ev) {
						this.shortMode = !mstpd.getStatusShortMode(this.recentData['bridge']);
						mstpd.setStatusShortMode(this.recentData['bridge'], this.shortMode);
						this.tableUpdateData(this.recentData, this.shortMode);
						ev.currentTarget.value = btnTitle(this.shortMode);
					}, this)
				})
			])
		]);
	}
});

return L.view.extend({
	__init__: function() {
		this.super('__init__', arguments);

		/* Inject CSS */
		var head = document.getElementsByTagName('head')[0];
		var css = E('link', { 'href':
			L.resource('mstpd/mstpd.css')
				+ '?v=#PKG_VERSION', 'rel': 'stylesheet' });

		head.appendChild(css);
	},

	load: function() {
		return Promise.all([
			L.resolveDefault(callMSTPStatus(), {}),
			mstpd.init()
		]);
	},

	startPolling: function() {
		poll.add(L.bind(function() {
			return callMSTPStatus().then(L.bind(function(data) {
				return this.renderData(data).then(L.bind(function(rendered) {
					var view = document.getElementById('view');
					dom.content(view, rendered);
					dom.append(view, this.addFooter());
				}, this));
			}, this));
		}, this));
	},

	renderData: function(bridges) {
		var m, s, o;

		if (bridges.hasOwnProperty('bridges'))
			bridges = bridges.bridges;
		else
			bridges = [];

		m = new form.Map('mstpd', _('STP/RSTP Status'),
			_('This page allows you to see current state of the STP/RSTP bridges and its ports'));

		m.tabbed = (bridges.length > 1) ? true : false;

		if (bridges.length == 0) {
			s = m.section(form.NamedSection, 'global', 'mstpd');

			o = s.option(form.DummyValue, '__info');
			o.write = function() {};
			o.remove = function() {};
			o.render = function() {
				return E('div', { 'class': 'alert-message warning' },
					_('No data to display. You must <a href="%s">select</a> at least one bridge for ' +
					  'controlling by the STP/RSTP service.')
						.format(L.url('admin/services/mstpd/config'))
				);
			};

			return m.render();
		}

		bridges.sort(function(a, b) {
			return a['bridge'].localeCompare(b['bridge']);
		});

		for (var i = 0; i < bridges.length; i++) {
			var br = bridges[i];
			var brname = br['bridge'].replace(/^(br-)/, '');

			s = m.section(form.NamedSection,
				brname, 'bridge-' + br['bridge'],
				_('Bridge "%s"').format(br['bridge']));

			s.addremove = false;
			s.anonymous = true;

			o = s.option(CBIBridgeStatus, '_brinfo');
			o.cfgvalue = L.bind(function(br) { return br; }, o, br);

			// Bridge ports status
			o = s.option(form.SectionValue, '_ports_' + br['bridge'],
				form.NamedSection, brname, 'bridge-' + br['bridge'],
				_('Bridge "%s" ports').format(br['bridge']));

			var ss = o.subsection;
			o = ss.option(CBIBridgePortsStatus, '_brportsinfo');
			o.cfgvalue = L.bind(function(br) { return br; }, o, br);
			o.shortMode = true;
		}

		return m.render();
	},

	render: function(data) {
		var bridges = data[0];
		this.startPolling();
		return this.renderData(bridges);
	},

	addFooter: function() {
		return [
			this.super('addFooter', arguments),
			mstpd.renderFooter()
		];
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
