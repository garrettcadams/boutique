var feed = new Instafeed({
  get: 'tagged',
  limit: 6,
  tagName: 'levertbeauty',
  clientId: 'a22b7dd600644a41a03e8e13daa0427c',
  accessToken: '1320412550.a22b7dd.b922892a48b94d8ab4086d7aa0a72929',
  template: 
  	'<a href="{{link}}" rel="ig" title="{{caption}}" target="_blank"><img class="instagram-image" src="{{image}}" /></a>'
  
});
feed.run();