var feedFooter = new Instafeed({
  get: 'user',
  userId: 1320412550,
  accessToken: '1320412550.a22b7dd.b922892a48b94d8ab4086d7aa0a72929',
  target: 'instafeed-footer',
  limit: 20,
  template: 
  	'<a class="grid__item large--one-tenth medium--one-tenth small--one-tenth" target="_blank" href="{{link}}" rel="ig" title="{{caption}}"><img class="instagram-footer-image" src="{{image}}" /></a>'
  
});
feedFooter.run();