import { useState, useEffect } from 'react';
import { message } from 'antd';

export function useGitHub() {
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubBranches, setGithubBranches] = useState([]);
  const [loadingGithubBranches, setLoadingGithubBranches] = useState(false);

  // Load repos from API on component mount
  useEffect(() => {
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const response = await fetch('/api/repos');
        if (response.ok) {
          const reposData = await response.json();
          setRepos(reposData);
        } else {
          console.error('Failed to fetch repos');
          message.error('Failed to load repositories');
        }
      } catch (error) {
        console.error('Error fetching repos:', error);
        message.error('Error loading repositories');
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, []);

  // GitHub branch fetching function - Updated to fetch ALL branches
  const fetchGithubBranches = async (repoUrl,repo_name) => {
    setLoadingGithubBranches(true);
    try {
      // Extract repo name from the full repo URL
      const repoName =repo_name? repo_name: repoUrl.replace('https://github.com/', '').replace('.git', '');
      console.log('Fetching ALL branches for repo:', repoName);
      
      let allBranches = [];
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const response = await fetch(`${import.meta.env.VITE_GITHUB_API_BASE}/repos/${import.meta.env.VITE_GITHUB_ORG}/${repoName}/branches?per_page=100&page=${page}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Preview-Builder-App'
          }
        });
        
        console.log(`GitHub API Response Status (Page ${page}):`, response.status);
        
        if (response.ok) {
          const branchesData = await response.json();
          console.log(`Branches data (Page ${page}):`, branchesData.length, 'branches');
          
          if (branchesData.length === 0) {
            hasMorePages = false;
          } else {
            allBranches = [...allBranches, ...branchesData];
            page++;
            
            // Check if we got less than 100 branches (indicating last page)
            if (branchesData.length < 100) {
              hasMorePages = false;
            }
          }
        } else {
          const errorText = await response.text();
          console.error('GitHub API Error Response:', errorText);
          message.error(`Failed to fetch branches from GitHub: ${response.status} ${response.statusText}`);
          hasMorePages = false;
        }
      }
      
      const branchNames = allBranches.map(branch => branch.name);
      setGithubBranches(branchNames);
      message.success(`Fetched ${branchNames.length} branches from GitHub`);
      
      // Log the branches for debugging
      console.log('All available branches:', branchNames);
      
    } catch (error) {
      console.error('Error fetching branches:', error);
      message.error(`Error fetching branches from GitHub: ${error.message}`);
      setGithubBranches([]);
    } finally {
      setLoadingGithubBranches(false);
    }
  };

  return {
    repos,
    loadingRepos,
    githubBranches,
    loadingGithubBranches,
    fetchGithubBranches
  };
} 