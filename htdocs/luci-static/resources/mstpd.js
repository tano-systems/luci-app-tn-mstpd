'use strict';
'require ui';
'require form';
'require network';
'require session';
'require uci';

const appVersion = '2.1.1';
const appHomeUrl = 'https://github.com/tano-systems/luci-app-tn-mstpd';

const appFooter = E('div', { 'class': 'cbi-section' }, [
	E('p', { 'class': 'cbi-section-node tano-copyright' }, [
		E('a', { 'href': appHomeUrl },
			_('MSTPd LuCI application (version %s)').format(appVersion)),
		E('br', {}),
		_('© 2018–2021, Tano Systems LLC, Anton Kikin'),
		' <',
		E('a', { 'href': 'mailto:a.kikin@tano-systems.com' },
			E('nobr', {}, 'a.kikin@tano-systems.com')),
		'>'
	])
]);

var CBIBridgesSelect = form.ListValue.extend({
	__name__: 'CBI.BridgesSelect',

	load: function(section_id) {
		return network.getDevices().then(L.bind(function(data) {
			this.devices = data;
			return this.super('load', section_id);
		}, this));
	},

	filter: function(section_id, value) {
		return true;
	},

	renderWidget: function(section_id, option_index, cfgvalue) {
		var values = L.toArray((cfgvalue != null) ? cfgvalue : this.default),
		    choices = {},
		    checked = {},
		    order = [];

		for (var i = 0; i < values.length; i++)
			checked[values[i]] = true;

		values = [];

		if (!this.multiple && (this.rmempty || this.optional))
			choices[''] = E('em', _('unspecified'));

		for (var i = 0; i < this.devices.length; i++) {
			var device = this.devices[i],
			    name = device.getName(),
			    type = device.getType();

			if (name == 'lo' || name == this.exclude || !this.filter(section_id, name))
				continue;

			if (type !== 'bridge')
				continue;

			if (this.onlystp && !device.getBridgeSTP())
				continue;

			if (this.noinactive && device.isUp() == false)
				continue;

			var item = E([
				E('img', {
					'title': device.getI18n(),
					'src': L.resource('icons/%s%s.png'.format(type, device.isUp() ? '' : '_disabled'))
				}),
				E('span', { 'class': 'hide-open' }, [ name ]),
				E('span', { 'class': 'hide-close'}, [ device.getI18n() ])
			]);

			var networks = device.getNetworks();

			if (networks.length > 0)
				L.dom.append(item.lastChild, [ ' (', networks.map(function(n) { return n.getName() }).join(', '), ')' ]);

			if (checked[name])
				values.push(name);

			choices[name] = item;
			order.push(name);
		}

		var widget = new ui.Dropdown(this.multiple ? values : values[0], choices, {
			id: this.cbid(section_id),
			sort: order,
			multiple: this.multiple,
			optional: this.optional || this.rmempty,
			disabled: (this.readonly != null) ? this.readonly : this.map.readonly,
			select_placeholder: E('em', _('unspecified')),
			display_items: this.display_size || this.size || 3,
			dropdown_items: this.dropdown_size || this.size || 5,
			validate: L.bind(this.validate, this, section_id),
			create: false,
			create_markup: '' +
				'<li data-value="{{value}}">' +
					'<img title="'+_('Custom Interface')+': &quot;{{value}}&quot;" src="'+L.resource('icons/ethernet_disabled.png')+'" />' +
					'<span class="hide-open">{{value}}</span>' +
					'<span class="hide-close">'+_('Custom Interface')+': "{{value}}"</span>' +
				'</li>'
		});

		return widget.render();
	},
});

function init() {
	return new Promise(function(resolveFn, rejectFn) {
		var data = session.getLocalData('luci-app-tn-mstpd');
		if ((data !== null) && data.hasOwnProperty('hideFooter')) {
			return resolveFn();
		}

		data = {};

		return uci.load('luci').then(function() {
			data.hideFooter = (uci.get('luci', 'app_tn_mstpd', 'hide_footer') == '1')
				? true : false;
			session.setLocalData('luci-app-tn-mstpd', data);
			return resolveFn();
		});
	});
}

function isNeedToHideFooter() {
	var data = session.getLocalData('luci-app-tn-mstpd');

	if (data === null)
		data = {};

	if (data.hasOwnProperty('hideFooter'))
		return data.hideFooter;
	else
		return false;
}

function renderFooter() {
	return isNeedToHideFooter() ? '' : appFooter;
}

return L.Class.extend({
	BridgesSelect: CBIBridgesSelect,
	renderFooter: renderFooter,
	init: init,
});
