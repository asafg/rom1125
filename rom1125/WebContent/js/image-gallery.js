/* image-gallery.js
 * 	creates an image gallery with thumbnails.
 * 	This class relies on HTML and CSS doing the visual part.
 * 	It assumes that there are containers for both the main image and the thumbnails.
 * 	The main image container is supposed to contain the whole set of images.
 * 	The thumbnails strip container is supposed to contain the whole set of thumbnail images.
 * 	There is another container that is the viewport - that is it defines what part of the strip is visible.
 *
 * Dependencies: mootools.js, clientcide's SimpleSlideShow.js
 */
var ImageGallery = new Class({
	Implements: [Events, Options, Chain],
	options: 
	{
		startIndex: 0,
		slides: [], //An array containing the slide elements (use $$('div_id') to get this array from the DOM
		thumbnails: [], //The whole strip, may contain more thumbnails than are visible throught the viewport
		thumbnailsViewport: 'thumbnails', //The id of the the thumbnails' viewport &lt;div&gt;
		thumbnailsContainer: 'thumbnails_wrapper', //The id of the thumbnails' strip &lt;div&gt; 
		nextThumbnailLink: false, //The id of the element that will be used as "next" button/link
		prevThumbnailLink: false, //The id of the element that will be used as "previous" button/link
		nextThumbnailLinkClass: false, //The CSS class that will be used for "next" thumbnail button/link
		prevThumbnailLinkClass: false, //The CSS class that will be used for "previous" thumbnail button/link
		nextSlideLink: false, //The id of the element that will be used as "next" slide button/link
		prevSlideLink: false, //The id of the element that will be used as "previous" slide button/link
		disabledLinkClassSuffix: '_disabled'
	},
	initialize: function(options)
	{
		this.setOptions(options);
		this.simpeSlideShow = new SimpleSlideShow(
		{
			startIndex: this.options.startIndex,
			slides: this.options.slides,
			nextLink: this.options.nextSlideLink,
			prevLink: this.options.prevSlideLink,
			wrap: false
		});
		this.isStripAnimating = false;
		this.linkThumbnails();
		this.setUpThumbnailsNav();
	},
	linkThumbnails: function()
	{
		this.thumbnails = this.options.thumbnails;
		for (var i = 0;i < this.thumbnails.length;i++)
		{
			this.thumbnails[i].addEvent('click', function(e)
			{ 
				e.stop();
				for (var i = 0;i < this.thumbnails.length;i++)
				{
					if (this.thumbnails[i] === e.target) //find the index of the clicked thumbnail
					{
						this.simpeSlideShow.show(i);
						break;
					}
				}
			}.bind(this));
		}
	},
	setUpThumbnailsNav: function()
	{
		var thumbsViewportWidth = $(this.options.thumbnailsViewport).getWidth();
		var thumbsStrip = $(this.options.thumbnailsContainer);
		var minLeft = thumbsViewportWidth - thumbsStrip.getWidth();
		var thumbWidth = thumbsStrip.getWidth() / this.thumbnails.length;
		this.getThumbsLeft = function()
		{
		    var left = thumbsStrip.getStyle('left');
		    //If 'left' style is not explicitly set in the CSS,
		    //MSIE 8.x returns 'auto' while FireFox returns the actual left property in pixels
		    if (left == 'auto') //MSIE
		    {
		        left = thumbsViewportWidth - thumbsStrip.getWidth();
		        //we set it explicitly for the tween effext to work properly from the very first time in MSIE as well
		        thumbsStrip.setStyle('left', left + 'px');
		    }
		    else
		    {
		        left = left.replace(/px$/,'').toInt();
		    }
		    return left;
		};
		this.hasNext = function() { return this.getThumbsLeft() < 0;};
		this.hasPrev = function() { return this.getThumbsLeft() > minLeft;};
		this.nextThumbClass = this.options.nextThumbnailLinkClass;
		this.prevThumbClass = this.options.prevThumbnailLinkClass;
		this.disabledClassSuffix = this.options.disabledLinkClassSuffix;
		var nextLink = $(this.options.nextThumbnailLink);
		var prevLink = $(this.options.prevThumbnailLink);
		var fx = new Fx.Tween(thumbsStrip);
		var nextLinkClicked = function(e)
		{
			e.stop();
			if (this.isStripAnimating) 
			{
				return;
			}
			var cls = this.nextThumbClass;
			var left = this.getThumbsLeft();
			if (this.hasNext()) 
			{	
				left += thumbWidth;
				if (left >= 0)
				{
					left = 0;
					if (nextLink.hasClass(cls))
					{
						nextLink.removeClass(cls);
						nextLink.addClass(cls + this.disabledClassSuffix);
					}
					prevLink.removeEvent('click', nextLinkClicked);
				}
				this.isStripAnimating = true;
				fx.start('left',left).chain(function()
				{
					this.isStripAnimating = false;
					if (this.options.prevThumbnailLink) this.setPrevLink();
				}.bind(this));
			}
		}.bindWithEvent(this);
		this.setNextLink = function()
		{
			var cls = this.nextThumbClass;
			if (this.hasNext())
			{
				if (nextLink.hasClass(cls + this.disabledClassSuffix))
				{
					nextLink.removeClass(cls + this.disabledClassSuffix);
					nextLink.addClass(cls);
				}
				nextLink.addEvent('click', nextLinkClicked);
			}
			else //disable "next" link
			{
				if (nextLink.hasClass(cls))
				{
					nextLink.removeClass(cls);
					nextLink.addClass(cls + this.disabledClassSuffix);
				}
				nextLink.removeEvent('click', nextLinkClicked);
			}
		};
		var prevLinkClicked = function(e)
		{
			e.stop();
			if (this.isStripAnimating) 
			{
				return;
			}
			var cls = this.prevThumbClass;
			var left = this.getThumbsLeft();
			if (left > minLeft) 
			{	
				left -= thumbWidth;
				if (left <= minLeft)
				{
					left = minLeft;
					if (prevLink.hasClass(cls))
					{
						prevLink.removeClass(cls);
						prevLink.addClass(cls + "_disabled");
					}
					prevLink.removeEvent('click', prevLinkClicked);
				}
				this.isStripAnimating = true;
				fx.start('left',left).chain(function()
				{
					this.isStripAnimating = false;
					if (this.options.nextThumbnailLink) this.setNextLink();
				}.bind(this));
			}
		}.bindWithEvent(this);
		this.setPrevLink = function()
		{
			var cls = this.prevThumbClass;
			if (this.hasPrev())
			{
				if (prevLink.hasClass(cls + "_disabled"))
				{
					prevLink.removeClass(cls + "_disabled");
					prevLink.addClass(cls);
				}
				prevLink.addEvent('click', prevLinkClicked);
			}
			else //disable "prev" link
			{
				if (prevLink.hasClass(cls))
				{
					prevLink.removeClass(cls);
					prevLink.addClass(cls + "_disabled");
				}
				prevLink.removeEvent('click', prevLinkClicked);
			}

		};
		if (nextLink) this.setNextLink();
		if (prevLink) this.setPrevLink();
	}
});