(function app_deck_charts(deck_charts, $) {

    Highcharts.setOptions({
        lang: {
            drillUpText: '< '+Translator.trans('forms.back')
        }
    });

	var faction_colors = {
        red: '#b22222',
        yellow: '#dab032',
        blue: '#0b609e',
        gray: '#979d9f'
    };

    var faction_names = {};
    function get_faction_name(faction_code) {
        if(!_.hasIn(faction_names, faction_code)) {
            faction_names[faction_code] = app.data.cards.find({faction_code: faction_code})[0].faction_name;
        }
        return faction_names[faction_code];
    }

    var rarity_colors = {
        S: '#bcbcbc',
        C: '#6d9eeb',
        U: '#fff56a',
        R: '#aeca36',
        L: '#a774b2'
    };

    var rarity_names = {};
    function get_rarity_name(rarity_code) {
        if(!_.hasIn(rarity_names, rarity_code)) {
            rarity_names[rarity_code] = app.data.cards.find({rarity_code: rarity_code})[0].rarity_name;
        }
        return rarity_names[rarity_code];
    }

	deck_charts.chart_type = function chart_type() {
        var categories = {};

        categories[Translator.trans('icon.upgrade')] = '<span class="icon icon-upgrade"></span>';
        categories[Translator.trans('icon.support')] = '<span class="icon icon-support"></span>';
        categories[Translator.trans('icon.event')] = '<span class="icon icon-event"></span>';

        var iData = {
            'upgrade': { i: 0, name: Translator.trans('icon.upgrade') },
            'support': { i: 1, name: Translator.trans('icon.support') },
            'event': { i: 2, name: Translator.trans('icon.event') }
        };

        var validTypes = {};
        var validIndexes = {};

        var series = [];
        var iSeries = {};

        var draw_deck = app.deck.get_draw_deck();
        draw_deck.forEach(function(card) {
            var serie;

            if (!iSeries[card.faction_code]) {
                serie = {
                    name: card.faction_name,
                    color: faction_colors[card.faction_code],
                    data: [0, 0, 0],
                    type: "column",
                    animation: false,
                    showInLegend: false
                };
                iSeries[card.faction_code] = serie;
                series.push(serie);
            } else {
                serie = iSeries[card.faction_code];
            }

            var d = iData[card.type_code];
            if (d !== undefined) {
                validTypes[d.name] = true;
                validIndexes[d.i] = true;
                serie.data[d.i] += card.indeck.cards;
            }
        });

        categories = _.omit(categories, function(value, key) {
            return !validTypes[key];
        });

        _.each(series, function(serie) {
            serie.data = _.filter(serie.data, function(value, index) {
                return validIndexes[index];
            });
        });

        $("#deck-chart-type").highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: Translator.trans('decks.charts.type.title')
            },
            subtitle: {
                text: ""
            },
            xAxis: {
                type: 'category',
                categories: _.keys(categories),
                labels: {
                    useHTML: true,
                    formatter: function() {
                        return categories[this.value];
                    }
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                allowDecimals: false,
                tickInterval: 2,
                title: null,
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: '<span style="font-weight: bold; color: {point.color}">{series.name}</span>: {point.y}<br/><b>'+Translator.trans('decks.charts.globals.total')+'</b>: {point.stackTotal}'
            },
            series: series,
            plotOptions: {
                column: {
                    stacking: 'normal',
                    borderWidth: 0,
                    groupPadding: 0,
                    shadow: false
                }
            }
        });
    };

    deck_charts.chart_rarity = function chart_rarity() {
        var raritiesData = [];
        var factionsData = {};

        ['S', 'C', 'U', 'R', 'L'].forEach(function(rarity_code) {
            var rarityData = {
                name: get_rarity_name(rarity_code),
                y: 0,
                color: rarity_colors[rarity_code],
                drilldown: rarity_code
            };
            ['blue', 'red', 'yellow', 'gray'].forEach(function(faction_code) {
                var characterSample = app.deck.get_cards(null, {type_code: 'character', rarity_code: rarity_code, faction_code: faction_code});
                var otherSample = app.deck.get_cards(null, {type_code: {$ne: 'character'}, rarity_code: rarity_code, faction_code: faction_code});
                var total = app.deck.get_nb_dice(characterSample) + app.deck.get_nb_cards(otherSample);
                if(total) {
                    rarityData.y += total;
                    if(!_.hasIn(factionsData, rarity_code)) factionsData[rarity_code] = [];
                    factionsData[rarity_code].push({
                        name: get_faction_name(faction_code),
                        y: total,
                        color: faction_colors[faction_code]
                    });
                }
            });
            if(rarityData.y) {
                raritiesData.push(rarityData);
            }
        });

        var factionSeries = [];
        ['S', 'C', 'U', 'R', 'L'].forEach(function(rarity_code) {
            factionSeries.push({
                name: get_rarity_name(rarity_code),
                id: rarity_code,
                data: factionsData[rarity_code]
            });
        });

        // Create the chart
        var options = {
            chart: {
                type: 'pie'
            },
            title: {
                text: Translator.trans('decks.charts.rarity.title')
            },
            subtitle: {
                text: Translator.trans('decks.charts.rarity.subtitle')
            },
            plotOptions: {
                pie: {
                    shadow: false,
                    borderWidth: 0,
                    states: {
                        hover: {
                            halo: {
                                size: 5
                            }
                        }
                    }
                },
                series: {
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                headerFormat: "<b>{series.name}</b><br/>",
                pointFormat: '<span style="font-weight: bold; color: {point.color}">{point.name}</span>: {point.y}<br/><b>'+Translator.trans('decks.charts.globals.total')+'</b>: {point.total}'
            },
            series: [{
                name: 'Rarities',
                tooltip: {
                    headerFormat: "<b>{point.key}</b><br/>",
                    pointFormat: Translator.trans("decks.charts.rarity.tooltip.amount", {
                        amount: "<b>{point.y}</b>", 
                        total: "<b>{point.total}</b>"
                    })+" ({point.percentage:.2f}%)"
                },
                data: raritiesData
            }],
            drilldown: {
                drillUpButton: {
                    relativeTo: 'plotBox',
                    position: {
                        y: -10
                    }
                },
                series: factionSeries
            }
        };
        $('#deck-chart-rarity').highcharts(options);
    };

    deck_charts.chart_cost = function chart_cost() {

		var data = [];

		var draw_deck = app.deck.get_draw_deck();
		draw_deck.forEach(function (card) {
			if(typeof card.cost === 'number') {
				data[card.cost] = data[card.cost] || 0;
				data[card.cost] += card.indeck.cards;
			}
		})
		data = _.flatten(data).map(function (value) { return value || 0; });

		$("#deck-chart-cost").highcharts({
			chart: {
				type: 'line'
			},
			title: {
	            text: Translator.trans("decks.charts.cost.title")
	        },
			subtitle: {
	            text: Translator.trans("decks.charts.cost.subtitle")
	        },
			xAxis: {
				allowDecimals: false,
				tickInterval: 1,
				title: {
					text: null
				}
			},
			yAxis: {
				min: 0,
				allowDecimals: false,
				tickInterval: 1,
				title: null,
				labels: {
					overflow: 'justify'
				}
			},
			tooltip: {
				headerFormat: '<span style="font-size: 10px">'+Translator.trans('decks.charts.cost.tooltip.header', {cost: '{point.key}'})+'</span><br/>'
			},
			series: [{
				animation: false,
				name: Translator.trans('decks.charts.cost.tooltip.label'),
				showInLegend: false,
				data: data
			}]
		});
	};


	deck_charts.setup = function setup(options) {
		deck_charts.chart_type();
        deck_charts.chart_rarity();
		deck_charts.chart_cost();
	}

	$(document).on('shown.bs.tab', 'a[data-toggle=tab]', function (e) {
		deck_charts.setup();
	});

})(app.deck_charts = {}, jQuery);
