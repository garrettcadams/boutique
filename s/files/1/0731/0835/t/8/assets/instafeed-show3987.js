

var feedFooter = new Instafeed({
  get: 'tagged',
  target: 'instafeed-show',
  limit: 4,
  tagName: 'levertbeauty',
  clientId: 'a22b7dd600644a41a03e8e13daa0427c',
  userId: 1320412550,
  accessToken: '1320412550.a22b7dd.b922892a48b94d8ab4086d7aa0a72929',
  template: 
  	'<a href="{{link}}" rel="ig" title="{{caption}}" target="_blank"><img class="instagram-show-footer-image" src="{{image}}" /></a>'
  
});
feedFooter.run();
