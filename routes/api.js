/*
 * Serve JSON to our AngularJS client
 */

var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');

function exportIndex (req, res, next) {
  return function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html), result = [];
      $('#content table tr').each(function () {
        var data = $(this), row = [];
        data.children().each(function (i, element) {
          if (i == 0) {
            var link = $('a', element).first().attr('href');
            link = link.substring(link.indexOf('=') + 1, link.length)
            row.push(link);
          }
          row.push($(element).text().trim());
				});

        result.push(_.zipObject(['id', 'name', 'description', 'note'], row));
      });

      res.json(result);
    }
    else {
      next(error);
    }
  };
}

function exportRound ($, context, r) {
  var result = {};
  var round = $(r !== 'FJ' ? 'table.round' : 'table.final_round', context);

  // Export categories
  $('tr', round).first().children().each(function (i, element) {
    var data = $(this);
    result[['category', r, i + 1].join('_')] = {
      category_name: $('.category_name', data).text(),
      category_comments: $('.category_comments', data).text(),
      media: $('a', data).length ? $('a', data).map(function (i, element) {
        return $(this).attr('href').replace('http://www.j-archive.com/', 'http://localhost:3000/');
      }).toArray() : undefined
    };
  });

  // Export clues
  $('.clue_text', round).each(function (i, element) {
    var data = $(this);
    var header = data.parent().prev();
    if (r === 'FJ') {
      header = data.parent().parent().parent().parent().prev();
    }

    var answerHtml = _.trimLeft(_.trimRight($('div', header).attr('onmouseover'), ')'), 'toggle(').split(', ').slice(2).join(', ');
    answerHtml = _.trim(_.trim(answerHtml), '\'').replace('\\"', '"').replace('\\"', '"');
    var link = $('.clue_order_number a', header).attr('href');
    var daily_double = header.find('.clue_value_daily_double').length;

    let clueId = data.attr('id');
    let indexOfUnderBarR = clueId.indexOf('_r');
    let clueIdEndsWithR = clueId.length === indexOfUnderBarR+2;

    if (clueIdEndsWithR) {
      clueId = clueId.substring(0, indexOfUnderBarR);
      if (result[clueId] !== null && result[clueId] !== undefined) {
        result[clueId].correct_response = $('em', data).text();
      }
    } else {
      result[clueId] = {
        id: link ? link.substring(link.indexOf('=') + 1, link.length) : undefined,
        daily_double: daily_double ? true : undefined,
        triple_stumper: _.contains(answerHtml, 'Triple Stumper') || undefined,
        clue_html: data.html(),
        clue_text: data.text(),
        correct_response: $('em', data).text(),
        media: $('a', data).length ? $('a', data).map(function (i, element) {
          return $(this).attr('href').replace('http://www.j-archive.com/', 'http://localhost:3000/');
        }).toArray() : undefined
      };
    }
  });

  return result;
}

exports.seasons = function (req, res, next) {
  request('http://www.j-archive.com/listseasons.php', exportIndex(req, res, next));
};

exports.season = function (req, res, next) {
  request('http://www.j-archive.com/showseason.php?season=' + req.params.id, exportIndex(req, res, next));
}

exports.game = function (req, res, next) {
  request('http://www.j-archive.com/showgame.php?game_id=' + req.params.id, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var result = {
        id: req.params.id,
        game_title: $('#game_title').text(),
        game_comments: $('#game_comments').text(),
        game_complete: false
      };

      _.assign(result,
        exportRound($, $('#jeopardy_round'), 'J'),
        exportRound($, $('#double_jeopardy_round'), 'DJ'),
        exportRound($, $('#final_jeopardy_round'), 'FJ'));

      result.game_complete = _.countBy(_.keys(result), function (n) {
        return n.split('_')[0];
      }).clue === (30 + 30 + 1);

      var clueCounts = _.countBy(_.keys(result), function (n) {
        return n.split('_').slice(0, 3).join('_');
      });

      _.forEach(result, function (n, key) {
        if (_.startsWith(key, 'category')) {
          n.clue_count = clueCounts[key.replace('category', 'clue')];
        }
      });

      res.json(result);
    }
    else {
      next(error);
    }
  });
}
