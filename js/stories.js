"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
   console.debug("generateStoryMarkup", story);
   const isFavorite = currentUser && currentUser.isFavorite(story.storyId);
   const starSymbol = isFavorite ? "★" : "☆";
   const hostName = story.getHostName();
   const deleteButton = currentUser && story.username === currentUser.username ? `<button class='delete-story'>Delete</button>` : '';

  return $(`
      <li id="${story.storyId}">
      <span class='star'>${starSymbol}</span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        ${deleteButton}
      </li>
    `);
}
$allStoriesList.on('click', '.delete-story', handleDeleteStory);
$allStoriesList.on('click', '.star', toggleStoryFavorite);

async function toggleStoryFavorite(evt){
  
  const storyId = $(evt.target).closest("li").attr('id');
  

  try{
    if (currentUser.isFavorite(storyId)){
      await currentUser.removeFavorite(storyId);
      $(evt.target).text('☆');
    }else {
      await currentUser.addFavorite(storyId);
      $(evt.target).text('★');
    }
  }catch (error){
    console.error('error toggling favorite', error);
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function submitStory(evt){
  evt.preventDefault();
  const title = $('#story-title').val();
  const author = $('#story-author').val();
  const url = $('#story-url').val();
  try{
  const newStory = await storyList.addStory(currentUser, {title, author, url});
  currentUser.ownStories.unshift(newStory);
  storyList.stories.unshift(newStory);
  $('#submit-story-form')[0].reset();
  //refreshed story list from server
  await getAndShowStoriesOnStart();

navAllStories(); // here

}catch (error){
  console.error('Error submitting story', error);
}
}
$('#submit-story-form').on('submit', submitStory); // this lol


function showSubmitStoryForm(){
  hidePageComponents();
  $('.submit-story-form-container').show();
}

// adding a comment here just to change the file. Write write write.



function showFavorites(){
  hidePageComponents();
  $allStoriesList.empty();
  currentUser.favorites.forEach(story => {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  });
  $allStoriesList.show();
}
$('#nav-favorites').on('click', function(){
  
  showFavorites();
 });

function showMyStories(){
  hidePageComponents();
  $allStoriesList.empty();
  currentUser.ownStories.forEach(story => {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  });
  $allStoriesList.show();
}

 $('#nav-my-stories').on('click', function(){
  
  showMyStories();
 });

 async function handleDeleteStory(evt){
  const storyId = $(evt.target).closest('li').attr('id');
  if (!confirm('Are you sure you want to delete this story?')){
    return;
  }
try{
    await axios.delete(`${BASE_URL}/stories/${storyId}`,{
      params: { token: currentUser.loginToken},
    });
    $(evt.target).closest('li').remove();
    storyList.stories = storyList.stories.filter(story => story.storyId !== storyId);
    currentUser.ownStories = currentUser.ownStories.filter(story => story.storyId !== storyId);

  }catch (error){
    console.error('error deleting story', error);
  }
 }