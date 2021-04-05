/** @namespace H5P */
H5P.VideoBrightcove = (function ($) {

  /**
   * Brightcove video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function Brightcove(sources, options, l10n) {
    var self = this;

    var player;
    var playbackRate = 1;
    var id = 'h5p-brightcove-' + numInstances;
    numInstances++;

    var $wrapper = $('<div/>');
    var $placeholder = $('<div/>', {
      id: id,
      html: '<div id="loading-wrapper">' + l10n.loading + '</div>'
    });

    const videoId = getId(sources[0].path);
    let videoJsTagId = 'curriki-brightcove';
    if (window.parent.currikiBrightcovePlayerExternal) {
      H5P.jQuery('#' + window.parent.currikiBrightcovePlayerExternal.tagAttributes.id, window.parent.document).remove();
      videoJsTagId = window.parent.currikiBrightcovePlayerExternal.tagAttributes.id;
    }

    H5P.jQuery('<video-js id="' + videoJsTagId + '" data-account="'+videoId.dataAccount+'" data-player="default" data-embed="default" controls="" data-video-id="'+videoId.dataVideoId+'" data-playlist-id="" data-application-id=""></video-js>').appendTo($placeholder);
    $placeholder.appendTo($wrapper);
    
    self.brightcoveUrlParts = null;
    self.isPlayerLoaded = false;
    
    // Optional placeholder
    // var $placeholder = $('<iframe id="' + id + '" type="text/html" width="640" height="360" src="https://www.brightcove.com/embed/' + getId(sources[0].path) + '?enablejsapi=1&origin=' + encodeURIComponent(ORIGIN) + '&autoplay=' + (options.autoplay ? 1 : 0) + '&controls=' + (options.controls ? 1 : 0) + '&disabledkb=' + (options.controls ? 0 : 1) + '&fs=0&loop=' + (options.loop ? 1 : 0) + '&rel=0&showinfo=0&iv_load_policy=3" frameborder="0"></iframe>').appendTo($wrapper);

    /**
     * Use the Brightcove API to create a new player
     *
     * @private
     */
    var create = function () {
      H5P.jQuery('#loading-wrapper').remove();
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }
      
      if (window.videojs === undefined) {
        // Load Bridghtcove library
        loadAPI(create);
        //return;
      }
      
      var intervalCount = 0;
      var videojsloadTime = setInterval(function(e) {
        if (window.videojs !== undefined) {
          /*var width = $wrapper.width();
          if (width < 200) {
            width = 200;
          }
          */
          const videoId = getId(sources[0].path);
          player = window.videojs('curriki-brightcove');
          player.ready(function() {
            //self.trigger('ready');
            self.trigger('loaded');
          });

          clearInterval(videojsloadTime);
        } else if (intervalCount === 20) {
          console.log("VideoJS not loaded. or it's taking too much load.");
          clearInterval(videojsloadTime);
        }
        intervalCount++;
      }, 1000);

    };

    /**
     * Indicates if the video must be clicked for it to start playing.
     * For instance Brightcove videos on iPad must be pressed to start playing.
     *
     * @public
     */
    self.pressToPlay = navigator.userAgent.match(/iPad/i) ? true : false;

    /**
    * Appends the video player to the DOM.
    *
    * @public
    * @param {jQuery} $container
    */
    self.appendTo = function ($container) {
      $container.addClass('h5p-brightcove').append($wrapper);
      create();
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
      if (!player || !player.getAvailableQualityLevels) {
        return;
      }

      var qualities = player.getAvailableQualityLevels();
      if (!qualities.length) {
        return; // No qualities
      }

      // Add labels
      for (var i = 0; i < qualities.length; i++) {
        var quality = qualities[i];
        var label = (LABELS[quality] !== undefined ? LABELS[quality] : 'Unknown'); // TODO: l10n
        qualities[i] = {
          name: quality,
          label: LABELS[quality]
        };
      }

      return qualities;
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
      if (!player || !player.getPlaybackQuality) {
        return;
      }

      var quality = player.getPlaybackQuality();
      return quality === 'unknown' ? undefined : quality;
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
      if (!player || !player.setPlaybackQuality) {
        return;
      }

      player.setPlaybackQuality(quality);
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = function () {
      if (!player || !player.play) {
        self.on('ready', self.play);
        return;
      }

      player.play();
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = function () {
      self.off('ready', self.play);
      if (!player || !player.pause) {
        return;
      }
      player.pause();
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      if (!player || !player.seekTo) {
        return;
      }

      player.seekTo(time, true);
    };

    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      if (!player || !player.getCurrentTime) {
        return;
      }

      return player.getCurrentTime();
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (!player || !player.duration) {
        return;
      }

      return player.duration();
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
      if (!player || !player.getVideoLoadedFraction) {
        return;
      }

      return player.getVideoLoadedFraction() * 100;
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      if (!player || !player.mute) {
        return;
      }

      player.mute();
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      if (!player || !player.unMute) {
        return;
      }

      player.unMute();
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      if (!player || !player.isMuted) {
        return;
      }

      return player.isMuted();
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      if (!player || !player.getVolume) {
        return;
      }

      return player.getVolume();
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      if (!player || !player.setVolume) {
        return;
      }

      player.setVolume(level);
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      return [0.25, 0.5, 1, 1.25, 1.5, 2];
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      if (!player || !player.getPlaybackRate) {
        return;
      }

      return player.getPlaybackRate();
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      if (!player || !player.setPlaybackRate) {
        return;
      }

      playbackRate = Number(newPlaybackRate);
      player.setPlaybackRate(playbackRate);
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      player.setOption('captions', 'track', track ? {languageCode: track.value} : {});
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      var track = player.getOption('captions', 'track');
      return (track.languageCode ? new H5P.Video.LabelValue(track.displayName, track.languageCode) : null);
    };

    // Respond to resize events by setting the YT player size.
    self.on('resize', function () {
      if (!$wrapper.is(':visible')) {
        return;
      }

      if (!player) {
        // Player isn't created yet. Try again.
        create();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: '100%'
      });

      var width = $wrapper[0].clientWidth;
      var height = options.fit ? $wrapper[0].clientHeight : (width * (9/16));

      // Set size
      $wrapper.css({
        width: width + 'px',
        height: height + 'px'
      });

      //player.setSize(width, height);
    });
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  Brightcove.canPlay = function (sources) {
    return getId(sources[0].path);
  };

  /**
   * Find id of Brightcove video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} Brightcove video identifier
   */

  var getId = function (url) {
    // Has some false positives, but should cover all regular URLs that people can find
    var matches = url.match(/((?:(?:https?|ftp|file):\/\/|www\.)players.brightcove.net)\/([0-9]*)\/(\w+)\/(index.html)\?(\w+)\=([0-9]*)/i);
    if (matches && matches.length === 7) {
      let brightcoveUrlParts = {dataAccount: matches[2], dataVideoId: matches[6]};
      self.brightcoveUrlParts = brightcoveUrlParts;
      return brightcoveUrlParts;
    }
  };

  /**
   * Load the IFrame Player API asynchronously.
   */
  var loadAPI = function (loaded) {  
    if (window.onBrightcoveIframeAPIReady !== undefined) {
      // Someone else is loading, hook in
      var original = window.onBrightcoveIframeAPIReady;
      window.onBrightcoveIframeAPIReady = function (id) {
        loaded(id);
        original(id);
      };
    }
    else {
      // Load the API our self
      var tag = document.createElement('script');
      tag.src = "https://players.brightcove.net/" + self.brightcoveUrlParts.dataAccount + "/default_default/index.min.js";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onBrightcoveIframeAPIReady = loaded;
    }
  };

  /** @constant {Object} */
  var LABELS = {
    highres: '2160p', // Old API support
    hd2160: '2160p', // (New API)
    hd1440: '1440p',
    hd1080: '1080p',
    hd720: '720p',
    large: '480p',
    medium: '360p',
    small: '240p',
    tiny: '144p',
    auto: 'Auto'
  };

  /** @private */
  var numInstances = 0;

  // Extract the current origin (used for security)
  var ORIGIN = window.location.href.match(/http[s]?:\/\/[^\/]+/);
  ORIGIN = !ORIGIN || ORIGIN[0] === undefined ? undefined : ORIGIN[0];
  // ORIGIN = undefined is needed to support fetching file from device local storage

  return Brightcove;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoBrightcove);
