/**
* Thumbnail Helper
* @description Get the thumbnail url from a post
* @example
*     <%- thumbnail(post) %>
*/
hexo.extend.helper.register('thumbnail', function (post) {
    return post.thumbnail || post.banner || '';
});
hexo.extend.helper.register('transTag', function(tags){
    let tagMap = {
        'Translation': '<span style="color:#008e59;">[译]</span>',
        'Banbrick': '<span style="color:#008e59;">[搬]</span>',
    };
    let arr = {};
    tags.each(tag=>{arr[tag.name] = tag.name});

    let target = arr['Translation'] && 'Translation';
    target = target || (arr['Banbrick'] && 'Banbrick');

    return tagMap[target] || '';
});
