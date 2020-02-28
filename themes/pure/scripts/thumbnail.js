/**
* Thumbnail Helper
* @description Get the thumbnail url from a post
* @example
*     <%- thumbnail(post) %>
*/
hexo.extend.helper.register('thumbnail', function (post) {
    return post.thumbnail || post.banner || '';
});
hexo.extend.helper.register('hasTag', function(arr, target){
    let result = false;
    arr.each(function(tag){
        console.log(tag.name===target, tag.name, target)
        if(tag.name === target) result = true;
    });

    return result;
});
