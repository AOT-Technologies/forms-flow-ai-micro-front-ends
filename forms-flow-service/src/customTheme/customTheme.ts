import Dark from './themes/dark';
import Purple from './themes/purple';
import DefaultBlue from './themes/defaultBlue';

const themeDataArray: { name: string; data: object }[] = [];

// Function to fetch data from a theme module and store it as an object
async function fetchThemeData(themeName: string, data: object): Promise<void> {
  themeDataArray.push({ name: themeName, data });
}

// Fetch data from each theme module and store it as an object
Promise.all([
  fetchThemeData('DefaultBlue', DefaultBlue),
  fetchThemeData('Dark', Dark),
  fetchThemeData('Purple', Purple),
  
])
  .then(() => {
    
  })
  .catch((error) => {
    console.error('Error fetching theme data:', error);
  });


const JsonService = themeDataArray;
export default JsonService;
