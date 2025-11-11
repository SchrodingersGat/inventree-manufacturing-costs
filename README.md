[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PyPI](https://img.shields.io/pypi/v/inventree-manufacturing-costs)](https://pypi.org/project/inventree-manufacturing-costs/)
![PEP](https://github.com/SchrodingersGat/inventree-manufacturing-costs/actions/workflows/ci.yaml/badge.svg)


# InvenTree Manufacturing Costs

An [InvenTree](https://inventree.org) plugin for capturing and managing manufacturing costs.

## Description

InvenTree provides tracking of raw material costs via Bills of Materials (BOMs). However, there are a number of additional costs associated with manufacturing a part which are not captured in the BOM structure. This plugin provides a framework for capturing and managing these additional costs, which may include:

- Labor costs
- Machine costs
- Overhead costs
- Processing costs
- Other miscellaneous costs

These costs are typically not captured in the BOM structure, but are important for accurate cost accounting and pricing.

### Manufacturing Rate

Multiple pre-defined manufacturing rates can be created, which capture the cost per unit time for a given process. For example, a CNC machine may have a cost of $50 per hour, while a manual assembly process may have a labor cost of $20 per hour.

These rates can be stored in the database, and assigned to specific manufacturing cost entries. This is useful for capturing recurring costs associated with time-based processes, and allows for easy updating of rates as costs change over time.

### Manufacturing Cost

A manufacturing cost captures a specific cost associated with the manufacturing of a particular assembly. This may include labor costs, machine costs, overhead costs, or other miscellaneous costs.

Each manufacturing cost may be associated with a specific manufacturing rate, allowing the cost to be calculated based on the rate required for the process. Alternatively, a fixed cost may be specified directly.

## Installation

### Via User Interface

The simplest way to install this plugin is from the InvenTree plugin interface. Enter the plugin name (`inventree-manufacturing-costs`) and click the `Install` button:

![Install Plugin](docs/img/install.png)

### Command Line 

To install manually via the command line, run the following command (ensuring you have access to the appropriate Python environment):

```bash
pip install -U inventree-manufacturing-costs
```

*Note: After the plugin is installed, it must be activated via the InvenTree plugin interface.*

## Usage

### Manufacturing Rates

To manage manufacturing rates, navigate to the "Manufacturing Rates" section in the InvenTree admin center. Here, you can create, edit, and delete manufacturing rates as needed:

![Manufacturing Rates](docs/img/manufacturing_rates.png)

### Manufacturing Costs

Manufacturing costs are associated with specified assemblies. To view or edit manufacturing costs for a specific part, navigate to the part detail page and select the "Manufacturing Costs" tab:

![Manufacturing Costs](docs/img/manufacturing_costs.png)

Note that this table only displays the manufacturing costs directly associated with the selected assembly. Costs associated with sub-assemblies are not displayed here - however these costs are included when exporting manufacturing costs (see below).

### Exporting Manufacturing Costs

Manufacturing costs can be exported to a CSV file for further analysis or reporting. To export manufacturing costs, click the "Export" button on the "Manufacturing Costs" tab for the desired assembly.

Exporting manufacturing costs will include all costs associated with the selected assembly, as well as manufacturing costs associated with any sub-assemblies.

This information can be used (in association with BOM cost information) to calculate the total cost of manufacturing a given assembly.

