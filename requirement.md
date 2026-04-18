# Requirements Document: Embodied Carbon Negotiator MVP

## Introduction

The Embodied Carbon Negotiator is a procurement decision-support tool designed for construction firms in India. It enables procurement managers to compare material options by embodied carbon across the supply chain, optimize selections against carbon budgets and cost ceilings, and generate AI-powered negotiation briefs for supplier discussions.

This MVP targets a 24-hour hackathon demo scenario: "Procuring materials for a 10-story residential building in Bangalore."

## Glossary

- **Embodied_Carbon**: The total greenhouse gas emissions (measured in kgCO2e) associated with the extraction, manufacturing, transportation, and installation of construction materials
- **EPD**: Environmental Product Declaration - a standardized document reporting the environmental impact of a product
- **Pareto_Frontier**: The set of optimal solutions where no improvement in one objective (cost or carbon) can be made without worsening the other
- **Carbon_Budget**: The maximum allowable embodied carbon (kgCO2e) for a project's material procurement
- **Cost_Ceiling**: The maximum allowable procurement cost (INR) for a project
- **Material_Entry**: A specific material product from a specific supplier with associated carbon footprint and price data
- **Procurement_Shortlist**: A curated list of material selections that meet both carbon and cost constraints
- **Negotiation_Brief**: An AI-generated document containing supplier-specific talking points and negotiation strategies
- **System**: The Embodied Carbon Negotiator application
- **Project**: A construction procurement project with defined carbon budget and cost ceiling
- **Material_Database**: The mock database containing material entries with carbon and cost data
- **Optimization_Engine**: The algorithm component that finds optimal cost-carbon combinations
- **AI_Assistant**: The GPT-4 powered component handling natural language processing and content generation

## Requirements

### Requirement 1: Project Creation and Configuration

**User Story:** As a procurement manager, I want to create a new procurement project with carbon and cost constraints, so that I can evaluate materials against my project's sustainability and budget goals.

#### Acceptance Criteria

1. THE System SHALL allow users to create a new Project with a unique name
2. WHEN creating a Project, THE System SHALL require a Carbon_Budget value in kgCO2e
3. WHEN creating a Project, THE System SHALL require a Cost_Ceiling value in INR
4. THE System SHALL validate that Carbon_Budget is a positive number
5. THE System SHALL validate that Cost_Ceiling is a positive number
6. WHEN a Project is created successfully, THE System SHALL display the project dashboard with the configured constraints
7. THE System SHALL persist Project data across browser sessions using local storage

### Requirement 2: Material Input with AI Interpretation

**User Story:** As a procurement manager, I want to add materials using natural language descriptions, so that I can quickly input my requirements without knowing exact database terminology.

#### Acceptance Criteria

1. THE System SHALL provide a text input field for material descriptions
2. WHEN a user enters a natural language material description, THE AI_Assistant SHALL interpret the description and map it to matching Material_Entry records in the Material_Database
3. THE System SHALL display matched materials with confidence scores for user confirmation
4. WHEN multiple matches exist, THE System SHALL present options ranked by relevance
5. THE System SHALL allow users to specify quantity for each material in standard units (kg, m², m³, pieces)
6. WHEN a user confirms a material selection, THE System SHALL add it to the Project's material list
7. IF the AI_Assistant cannot find a matching material, THEN THE System SHALL suggest the closest alternatives and allow manual selection

### Requirement 3: Material Database with India-Localized Data

**User Story:** As a procurement manager, I want access to a database of Indian construction materials with carbon and cost data, so that I can make informed procurement decisions.

#### Acceptance Criteria

1. THE Material_Database SHALL contain between 50 and 100 unique material entries
2. THE Material_Database SHALL include materials across six categories: steel, cement, insulation, glass, aggregates, and timber
3. EACH material category SHALL have at least 8 material entries
4. EACH material entry SHALL have between 3 and 5 supplier options
5. EACH Material_Entry SHALL include: material name, category, supplier name, unit price (INR), Embodied_Carbon per unit (kgCO2e), unit of measurement, and regional availability
6. THE Material_Database SHALL include Indian manufacturer names and regional supply chain data
7. THE System SHALL allow filtering materials by category, carbon footprint range, and price range
8. THE System SHALL allow sorting materials by price, carbon footprint, or supplier name

### Requirement 4: Carbon Estimation for Missing EPD Data

**User Story:** As a procurement manager, I want the system to estimate carbon footprints when EPD data is unavailable, so that I can still compare materials comprehensively.

#### Acceptance Criteria

1. WHEN a Material_Entry lacks EPD data, THE AI_Assistant SHALL estimate Embodied_Carbon based on similar materials in the Material_Database
2. THE System SHALL clearly mark estimated carbon values with an "Estimated" indicator
3. THE System SHALL display the estimation confidence level (high, medium, low)
4. THE System SHALL show the reference materials used for the estimation
5. WHEN displaying estimated values, THE System SHALL include a disclaimer about estimation uncertainty

### Requirement 5: Cost-Carbon Optimization Engine

**User Story:** As a procurement manager, I want the system to find optimal material combinations that meet my carbon budget and cost ceiling, so that I can make data-driven procurement decisions.

#### Acceptance Criteria

1. WHEN a user requests optimization, THE Optimization_Engine SHALL analyze all possible material combinations for the Project
2. THE Optimization_Engine SHALL identify combinations that satisfy both the Carbon_Budget and Cost_Ceiling constraints
3. THE Optimization_Engine SHALL calculate the Pareto_Frontier of optimal cost-carbon tradeoffs
4. IF no combination satisfies both constraints, THEN THE System SHALL display the closest feasible options and indicate which constraint is violated
5. THE System SHALL rank feasible combinations by a weighted score of cost and carbon savings
6. THE Optimization_Engine SHALL complete analysis within 5 seconds for projects with up to 20 material selections
7. THE System SHALL display optimization results with total cost, total carbon, and savings compared to baseline selections

### Requirement 6: Pareto Frontier Visualization

**User Story:** As a procurement manager, I want to see an interactive chart of cost vs carbon tradeoffs, so that I can understand the optimization landscape and make informed decisions.

#### Acceptance Criteria

1. THE System SHALL display a scatter plot with total cost (INR) on the X-axis and total Embodied_Carbon (kgCO2e) on the Y-axis
2. THE System SHALL highlight the Pareto_Frontier as a connected line through optimal points
3. THE System SHALL mark the Carbon_Budget as a horizontal reference line
4. THE System SHALL mark the Cost_Ceiling as a vertical reference line
5. WHEN a user hovers over a point, THE System SHALL display the material combination details in a tooltip
6. WHEN a user clicks a point, THE System SHALL select that combination as the active Procurement_Shortlist
7. THE System SHALL visually distinguish feasible combinations (meeting both constraints) from infeasible ones
8. THE System SHALL allow zooming and panning on the visualization

### Requirement 7: AI-Powered Negotiation Brief Generation

**User Story:** As a procurement manager, I want AI-generated negotiation briefs for each supplier, so that I can effectively negotiate better prices or carbon commitments.

#### Acceptance Criteria

1. WHEN a user selects a Procurement_Shortlist, THE System SHALL enable negotiation brief generation for each supplier in the shortlist
2. WHEN requested, THE AI_Assistant SHALL generate a Negotiation_Brief containing supplier-specific talking points
3. THE Negotiation_Brief SHALL highlight the supplier's carbon performance relative to competitors
4. THE Negotiation_Brief SHALL include specific negotiation strategies based on the supplier's strengths and weaknesses
5. THE Negotiation_Brief SHALL suggest volume-based discount opportunities
6. THE Negotiation_Brief SHALL propose carbon improvement commitments the supplier could make
7. THE System SHALL allow users to regenerate briefs with different negotiation priorities (cost-focused, carbon-focused, balanced)
8. THE System SHALL allow copying or downloading individual Negotiation_Briefs

### Requirement 8: AI-Powered Alternative Material Suggestions

**User Story:** As a procurement manager, I want the system to suggest lower-carbon material alternatives I haven't considered, so that I can discover new ways to reduce my project's carbon footprint.

#### Acceptance Criteria

1. WHEN a user views their material list, THE AI_Assistant SHALL analyze selections and identify potential lower-carbon alternatives
2. THE System SHALL display alternative suggestions with carbon savings potential (kgCO2e and percentage)
3. THE System SHALL display cost impact of each alternative (INR difference and percentage)
4. THE AI_Assistant SHALL explain why each alternative is suitable as a replacement
5. THE System SHALL allow users to swap a material for a suggested alternative with one click
6. WHEN an alternative is selected, THE System SHALL recalculate project totals automatically
7. THE System SHALL prioritize alternatives that maintain or improve cost while reducing carbon

### Requirement 9: Report Generation and Export

**User Story:** As a procurement manager, I want to generate a summary report for stakeholder presentations, so that I can communicate procurement decisions and their sustainability impact.

#### Acceptance Criteria

1. THE System SHALL generate a procurement summary report containing: project name, constraints, selected materials, total cost, total carbon, and savings achieved
2. THE AI_Assistant SHALL generate an executive summary narrative explaining the procurement strategy and sustainability benefits
3. THE report SHALL include a comparison table of selected materials vs baseline options
4. THE report SHALL include the Pareto visualization as an embedded chart
5. THE System SHALL export reports in PDF format
6. THE System SHALL export material data in CSV format
7. THE report SHALL include a breakdown of carbon by material category
8. THE report SHALL display cost and carbon per square meter metrics for the project

### Requirement 10: Demo Scenario Support

**User Story:** As a hackathon presenter, I want pre-configured demo data for a Bangalore residential building project, so that I can demonstrate the system's capabilities effectively.

#### Acceptance Criteria

1. THE System SHALL include a pre-configured demo Project named "10-Story Residential Building - Bangalore"
2. THE demo Project SHALL have a realistic Carbon_Budget of 500,000 kgCO2e
3. THE demo Project SHALL have a realistic Cost_Ceiling of 50,000,000 INR
4. THE demo Project SHALL include pre-populated material requirements for: structural steel, cement, glass facades, insulation, aggregates, and timber finishes
5. WHEN a user selects "Load Demo", THE System SHALL populate the demo Project with all pre-configured data
6. THE demo data SHALL showcase the full range of system capabilities including optimization, visualization, and AI features

This paste expires in <30 min. Public IP access. Share whatever you see with others in seconds with Context.Terms of ServiceReport this
