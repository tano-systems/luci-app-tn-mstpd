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
	'force-protocol-version'     : _('Administrative protocol'),
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
	'port'                       : _('Port'),
	'enabled'                    : _('Enabled', 'Port status'),
	'bpdu-filter-port'           : _('STP/RSTP processing'),
	'bpdu-guard-port'            : _('BPDU guard'),
	'bpdu-guard-error'           : _('BPDU guard error'),
	'received-stp'               : _('Operative protocol'),
	'role'                       : _('Role'),
	'state'                      : _('State'),
	'port-id'                    : _('Identifier'),
	'external-port-cost'         : _('Path cost'),
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
	'num-rx-tcn'                 : _('Rx TCN'),
	'num-transition-fwd'         : _('Transitions to "Forwarding" state'),
	'num-transition-blk'         : _('Transitions to "Blocking" state'),
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

function mstpd_br_param_add(br, option, value_cb_func)
{
	if (!mstpdBridgeParams[option] || (typeof br[option] == 'undefined'))
		return '';

	if (!value_cb_func)
		value_cb_func = function(br, v) { return v; }

	return E('div', {}, [
		E('span', { 'class': 'mstpd-param' }, mstpdBridgeParams[option]),
		E('span', { 'class': 'mstpd-param-value' }, value_cb_func(br, br[option]))
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

		items.push(mstpd_br_param_add(br, 'enabled', vcb_yn));

		items.push(mstpd_br_param_add(br, 'force-protocol-version', function(br, v) {
			return v.toUpperCase()
		}));

		items.push(mstpd_br_param_add(br, 'bridge-id'));
		items.push(mstpd_br_param_add(br, 'designated-root'));
		items.push(mstpd_br_param_add(br, 'regional-root'));

		items.push(mstpd_br_param_add(br, 'root-port', function(br, v) {
			return ((v == 'none') || (v == '')) ? _('none', 'Port name') : v
		}));

		items.push(mstpd_br_param_add(br, 'path-cost'));
		items.push(mstpd_br_param_add(br, 'max-age', vcb_seconds));
		items.push(mstpd_br_param_add(br, 'forward-delay', vcb_seconds));
		items.push(mstpd_br_param_add(br, 'tx-hold-count'));
		items.push(mstpd_br_param_add(br, 'hello-time', vcb_seconds));
		items.push(mstpd_br_param_add(br, 'ageing-time', vcb_seconds));
		items.push(mstpd_br_param_add(br, 'time-since-topology-change', vcb_time));

		items.push(mstpd_br_param_add(br, 'last-topology-change-port', function(br, v) {
			return ((v == 'None') || (v == '')) ? _('none', 'Port name') : v
		}));

		items.push(mstpd_br_param_add(br, 'topology-change-count'));

		return E('div', { 'class': 'mstpd-params mstpd-br-params' }, items);
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

function mstpd_br_port_param_add(br, port, option, value_cb_func, bpdu_filter)
{
	if (!mstpdBridgePortParams[option])
		return null;

	if (!value_cb_func)
		value_cb_func = function(br, v) { return v };

	if (bpdu_filter) {
		if (port['bpdu-filter-port'] == 'yes') {
			return '–';
		}
	}

	return value_cb_func(br, port[option]);
}

function mstpd_br_port_ex_param_add(br, port, option, value_cb_func, bpdu_filter)
{
	var value = mstpd_br_port_param_add(br, port, option, value_cb_func, bpdu_filter);

	if (value === '')
		return value;

	return E('div', {}, [
		E('span', { 'class': 'mstpd-param' }, mstpdBridgePortParams[option]),
		E('span', { 'class': 'mstpd-param-value' }, value)
	]);
}

var rowsExpanded = [];

var CBIBridgePortsStatus = form.DummyValue.extend({
	__init__: function() {
		this.super('__init__', arguments);

		this.recentData = null;
		this.table = E('table', { 'class': 'table mstpd-brports-status' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th top left'  }, mstpdBridgePortParams['port']),
				E('th', { 'class': 'th top left'  }, mstpdBridgePortParams['enabled']),
				E('th', { 'class': 'th top left'  }, mstpdBridgePortParams['received-stp']),
				E('th', { 'class': 'th top right' }, mstpdBridgePortParams['role']),
				E('th', { 'class': 'th top left'  }, mstpdBridgePortParams['state']),
				E('th', { 'class': 'th top right' }, mstpdBridgePortParams['port-id']),
				E('th', { 'class': 'th top right' }, mstpdBridgePortParams['num-tx-bpdu']),
				E('th', { 'class': 'th top right' }, mstpdBridgePortParams['num-rx-bpdu']),
			]),
			E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td' },
					E('em', { 'class': 'spinning' }, _('Collecting data...'))
				)
			])
		]);
	},

	/** @private */
	handleToggleRow: function(row, row_id) {
		var e_img      = row.querySelector('img');
		var e_extrow   = row.nextSibling;

		var do_expand = (e_extrow.style.display === 'none');

		if (do_expand) {
			row.classList.remove('mstpd-collapsed');
			row.classList.add('mstpd-expanded');
		}
		else {
			row.classList.remove('mstpd-expanded');
			row.classList.add('mstpd-collapsed');
		}

		rowsExpanded[row_id] = do_expand;

		e_extrow.style.display = do_expand ? 'table-row' : 'none';
		e_img.src = this.getFoldingImage(do_expand);
	},

	/** @private */
	updateTable: function(table, data, placeholder) {
		var target = isElem(table) ? table : document.querySelector(table);

		if (!isElem(target))
			return;

		target.querySelectorAll(
			'.tr.table-titles, .cbi-section-table-titles').forEach(L.bind(function(thead) {
			var titles = [];

			thead.querySelectorAll('.th').forEach(function(th) {
				titles.push(th);
			});

			if (Array.isArray(data)) {
				var n = 0, rows = target.querySelectorAll('.tr');

				data.forEach(L.bind(function(row) {
					var id = row[0];
					var is_expanded = rowsExpanded[id] || false;
					var trow = E('tr', {
						'id': 'row-' + id + '-normal',
						'class': 'tr ' + (is_expanded ? 'mstpd-expanded' : 'mstpd-collapsed'),
						'click': L.bind(function(ev) {
							this.handleToggleRow(ev.currentTarget, id);
						}, this)
					});

					for (var i = 0; i < titles.length; i++) {
						var text = (titles[i].innerText || '').trim();
						var td = trow.appendChild(E('td', {
							'class': titles[i].className,
							'data-title': (text !== '') ? text : null
						}, row[i + 1] || ''));

						td.classList.remove('th');
						td.classList.add('td');
					}

					var rowstyle = (n++ % 2) ? 2 : 1;

					trow.classList.add('cbi-rowstyle-%d'.format(rowstyle));

					if (rows[n])
						target.replaceChild(trow, rows[n]);
					else
						target.appendChild(trow);

					if (typeof row[titles.length + 1] !== 'undefined') {
						/* Add expanded information row */
						var trow = E('tr', {
							'id': 'row-' + id + '-extended',
							'class': 'tr mstpd-extrow',
							'style': 'display: ' +
								(is_expanded ? 'table-row' : 'none') + ';',
						});

						var td = trow.appendChild(E('td', {
							'class': 'td', 'colspan': titles.length
						}, row[titles.length + 1]));

						trow.classList.add('cbi-rowstyle-%d'.format(rowstyle));

						if (rows[n + 1])
							target.replaceChild(trow, rows[n + 1]);
						else
							target.appendChild(trow);
					}

				}, this));

				while (rows[++n])
					target.removeChild(rows[n]);

				if (placeholder && target.firstElementChild === target.lastElementChild) {
					var trow = target.appendChild(
						E('tr', { 'class': 'tr placeholder' }));

					var td = trow.appendChild(
						E('td', { 'class': 'center ' + titles[0].className }, placeholder));

					td.classList.remove('th');
					td.classList.add('td');
				}
			} else {
				thead.parentNode.style.display = 'none';

				thead.parentNode.querySelectorAll('.tr, .cbi-section-table-row').forEach(function(trow) {
					if (trow !== thead) {
						var n = 0;
						trow.querySelectorAll('.th, .td').forEach(function(td) {
							if (n < titles.length) {
								var text = (titles[n++].innerText || '').trim();
								if (text !== '')
									td.setAttribute('data-title', text);
							}
						});
					}
				});

				thead.parentNode.style.display = '';
			}
		}, this));
	},

	/** @private */
	getFoldingImage: function(expanded) {
		return L.resource('mstpd/details_' +
			(expanded ? 'hide' : 'show') + '.svg');
	},

	tableUpdateData: function(br) {
		var rows = [];

		br.ports.forEach(function(p) {
			var items = [];

			items.push(mstpd_br_port_ex_param_add(br, p, 'bpdu-filter-port', vcb_yn_inverted));
			items.push(mstpd_br_port_ex_param_add(br, p, 'designated-root', null, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'designated-bridge', null, true));

			items.push(mstpd_br_port_ex_param_add(br, p, 'designated-port', function(br, v) {
				if (v === '0.000')
					return '–';
				return v;
			}, true));

			items.push(mstpd_br_port_ex_param_add(br, p, 'external-port-cost', null, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'admin-edge-port', vcb_yn, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'auto-edge-port', vcb_yn, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'oper-edge-port', vcb_yn, true)) ;
			items.push(mstpd_br_port_ex_param_add(br, p, 'admin-point-to-point', vcb_yna, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'point-to-point', vcb_yn, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'bpdu-guard-port', vcb_yn));
			items.push(mstpd_br_port_ex_param_add(br, p, 'bpdu-guard-error', vcb_yn));
			items.push(mstpd_br_port_ex_param_add(br, p, 'num-rx-bpdu-filtered', vcb_num_or_dash));
			items.push(mstpd_br_port_ex_param_add(br, p, 'num-tx-tcn', vcb_num_or_dash, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'num-rx-tcn', vcb_num_or_dash, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'num-transition-fwd', vcb_num_or_dash, true));
			items.push(mstpd_br_port_ex_param_add(br, p, 'num-transition-blk', vcb_num_or_dash, true));

			var expanded_info = E('div', { 'class': 'mstpd-params mstpd-port-params' }, items);

			var id = p['bridge'] + '-' + p['port'];

			rows.push([
				id,
				E('div', { 'style': 'display: flex; flex-flow: row;' }, [
					E('img', {
						'class': 'mstpd-folding',
						'style': 'width: 16px; margin-right: 8px;',
						'src': this.getFoldingImage(rowsExpanded[id] || false)
					}),
					E('span', {}, mstpd_br_port_param_add(br, p, 'port')),
				]),
				mstpd_br_port_param_add(br, p, 'enabled', vcb_yn),
				mstpd_br_port_param_add(br, p, 'received-stp', function(br, v) {
					if (br['force-protocol-version'] === 'stp') {
						return E('span', { 'class': 'mstpd-badge mstpd-proto-ok' }, 'STP');
					} else {
						if (v === 'yes')
							return E('span', { 'class': 'mstpd-badge mstpd-proto-changed' }, 'STP');
						else
							return E('span', { 'class': 'mstpd-badge mstpd-proto-ok' }, 'RSTP');
					}
				}, true),
				mstpd_br_port_param_add(br, p, 'role', vcb_port_role, true),
				mstpd_br_port_param_add(br, p, 'state', vcb_port_state, true),
				mstpd_br_port_param_add(br, p, 'port-id'),
				mstpd_br_port_param_add(br, p, 'num-tx-bpdu', vcb_num_or_dash, true),
				mstpd_br_port_param_add(br, p, 'num-rx-bpdu', vcb_num_or_dash, true),
				expanded_info
			]);
		}.bind(this));

		this.updateTable(this.table, rows, 
			_('There is no available information'));
	},

	renderWidget: function(section_id, options_id, cfgvalue) {
		var br = cfgvalue;

		if (!br || !br.hasOwnProperty('bridge')) {
			return E('div', { 'class': 'alert-message warning' },
				_('No data to display. Perhaps no bridges are ' +
				  'configured to be controlled by the STP/RSTP service.'));
		}

		this.tableUpdateData(br);
		this.recentData = br;

		return E('div', { 'class': 'table-wrapper' }, this.table);
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
